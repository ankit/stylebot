import { googleAuthError } from './errors';
import {
  getAuthURL,
  getRandomString,
  refreshAccessToken,
  requestToken,
  type IssuedToken,
} from './desktop-client';

// A redirect rule sends it to the extension's own page before it loads.
const REDIRECT_URI = 'http://127.0.0.1/stylebot-auth';
const REDIRECT_PAGE = 'google-sign-in/index.html';
const REDIRECT_RULE_ID = 1;

/**
 * Whether a tab landed on the loopback redirect itself, which happens when
 * the redirect rule can't run, such as with the extension's site access
 * limited.
 */
export const isSignInRedirect = (url: string): boolean =>
  url.startsWith(`${REDIRECT_URI}?`);

/**
 * Sends Google's redirect to the extension's own page, keeping its query,
 * since Google only accepts a loopback address from a Desktop client.
 * Plain strings, as Safari has no RuleActionType or ResourceType enums.
 */
const addRedirectRule = (): Promise<void> =>
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [REDIRECT_RULE_ID],
    addRules: [
      {
        id: REDIRECT_RULE_ID,
        priority: 1,
        action: {
          type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
          redirect: {
            regexSubstitution: `${chrome.runtime.getURL(REDIRECT_PAGE)}\\1`,
          },
        },
        condition: {
          regexFilter: `^${REDIRECT_URI.replace(/\./g, '\\.')}(\\?.*)?$`,
          resourceTypes: [
            'main_frame' as chrome.declarativeNetRequest.ResourceType,
          ],
        },
      },
    ],
  });

const removeRedirectRule = (): Promise<void> =>
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [REDIRECT_RULE_ID],
  });

/*
 * In storage, since Safari can unload the background mid sign-in; a list, so
 * a code that comes back for any sign-in still started is used.
 */
const SIGN_INS_KEY = 'google-drive-sign-in';

// Sign-ins started before each kept its own refresh token key were Drive's.
const DRIVE_REFRESH_TOKEN_KEY = 'google-drive-refresh-token';

type SignIn = {
  state: string;
  verifier: string;
  tabId: number;
  openerTabId?: number;
  refreshTokenKey?: string;
  status: 'pending' | 'done' | 'failed';
  error?: string;
};

const getRefreshTokenKey = (signIn: SignIn): string =>
  signIn.refreshTokenKey ?? DRIVE_REFRESH_TOKEN_KEY;

const isPendingForRefreshToken = (
  signIn: SignIn,
  refreshTokenKey: string
): boolean =>
  signIn.status === 'pending' && getRefreshTokenKey(signIn) === refreshTokenKey;

const getSignIns = async (): Promise<Array<SignIn>> => {
  const stored = (await chrome.storage.local.get(SIGN_INS_KEY))[SIGN_INS_KEY];
  return Array.isArray(stored) ? stored : [];
};

const setSignIns = (signIns: Array<SignIn>): Promise<void> =>
  chrome.storage.local.set({ [SIGN_INS_KEY]: signIns });

export const CLOSE_GRACE_MS = 5000;

const closeTab = (tabId: number): Promise<void> =>
  chrome.tabs.remove(tabId).catch(() => undefined);

const isTabOpen = (tabId: number): Promise<boolean> =>
  chrome.tabs.get(tabId).then(
    () => true,
    () => false
  );

/**
 * Settles when the sign-in in `tabId` finishes, or fails if the user closes
 * the tab before Google sends them back.
 */
const waitForSignIn = (tabId: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      const signIns: Array<SignIn> | undefined =
        changes[SIGN_INS_KEY]?.newValue;
      const signIn = signIns?.find(each => each.tabId === tabId);

      if (area !== 'local' || !signIn) {
        return;
      }

      if (signIn.status === 'done') {
        cleanUp();
        resolve();
      } else if (signIn.status === 'failed') {
        cleanUp();
        reject(
          googleAuthError(
            signIn.error
              ? `Authorization failure: ${signIn.error}`
              : 'Authorization failure',
            'sign-in'
          )
        );
      }
    };

    const onRemoved = async (removedTabId: number) => {
      if (removedTabId !== tabId) {
        return;
      }

      // Safari reports the tab removed as it moves to our page under a new id,
      // so only a sign-in still pending after that was closed by the user.
      await new Promise(settle => setTimeout(settle, CLOSE_GRACE_MS));

      const signIns = await getSignIns();
      const signIn = signIns.find(each => each.tabId === tabId);

      if (signIn?.status === 'pending') {
        cleanUp();
        await setSignIns(signIns.filter(each => each !== signIn));
        if (
          !signIns.some(each => each !== signIn && each.status === 'pending')
        ) {
          await removeRedirectRule();
        }
        reject(googleAuthError('Sign-in window closed', 'sign-in'));
      }
    };

    const cleanUp = () => {
      chrome.storage.onChanged.removeListener(onChanged);
      chrome.tabs.onRemoved.removeListener(onRemoved);
    };

    chrome.storage.onChanged.addListener(onChanged);
    chrome.tabs.onRemoved.addListener(onRemoved);
  });

/**
 * Opens Google's consent page in a tab, with PKCE, or brings back one
 * already open for the same refresh token so a second sync doesn't start a
 * second sign-in.
 */
const startSignIn = async (
  scopes: Array<string>,
  refreshTokenKey: string
): Promise<number> => {
  const signIns = await getSignIns();
  const pending = signIns.filter(each =>
    isPendingForRefreshToken(each, refreshTokenKey)
  );

  for (const signIn of pending) {
    const open = await isTabOpen(signIn.tabId);

    if (open) {
      chrome.tabs.update(signIn.tabId, { active: true });
      return signIn.tabId;
    }
  }

  const verifier = getRandomString();
  const state = getRandomString();

  const authURL = await getAuthURL({
    scopes,
    redirectURI: REDIRECT_URI,
    verifier,
    state,
  });

  const [opener] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  await addRedirectRule();
  const tab = await chrome.tabs.create({ url: authURL });
  const tabId = tab.id as number;

  await setSignIns([
    ...signIns.filter(each => each.status === 'pending'),
    {
      state,
      verifier,
      tabId,
      openerTabId: opener?.id,
      refreshTokenKey,
      status: 'pending',
    },
  ]);

  return tabId;
};

const opening = new Map<string, Promise<number>>();

/**
 * Overlapping calls in one background for the same refresh token share a
 * single tab.
 */
const openSignInTab = (
  scopes: Array<string>,
  refreshTokenKey: string
): Promise<number> => {
  const pending = opening.get(refreshTokenKey);

  if (pending) {
    return pending;
  }

  const tab = startSignIn(scopes, refreshTokenKey).finally(() =>
    opening.delete(refreshTokenKey)
  );

  opening.set(refreshTokenKey, tab);
  return tab;
};

/**
 * Signs in to Google in a tab and resolves with a fresh access token once
 * the background has stored, under `refreshTokenKey`, the refresh token the
 * sign-in returned.
 */
export const signInWithRedirectRule = async (
  scopes: Array<string>,
  refreshTokenKey: string
): Promise<IssuedToken> => {
  const tabId = await openSignInTab(scopes, refreshTokenKey);
  await waitForSignIn(tabId);

  const issued = await refreshAccessToken(refreshTokenKey);
  if (!issued) {
    throw googleAuthError('Token refresh failure', 'sign-in');
  }

  return issued;
};

/**
 * Finishes a sign-in from the URL Google redirected its tab to: matches it
 * to a sign-in we started, trades the code for a refresh token, and closes
 * every sign-in tab, including the redirected one. Resolves whether a
 * sign-in completed.
 */
export const handleSignInRedirect = async (
  url: string,
  redirectTabId?: number
): Promise<boolean> => {
  const signIns = await getSignIns();
  const redirect = new URL(url);
  const code = redirect.searchParams.get('code');
  const state = redirect.searchParams.get('state');
  const signIn = signIns.find(
    each => each.status === 'pending' && each.state === state
  );

  if (!signIn) {
    return false;
  }

  let refreshToken: string | undefined;
  let error: string | undefined = code ? undefined : 'no code';

  try {
    if (code) {
      const json = await requestToken({
        grant_type: 'authorization_code',
        code,
        code_verifier: signIn.verifier,
        redirect_uri: REDIRECT_URI,
      });
      refreshToken = json.refresh_token;

      if (!refreshToken) {
        error = [json.error ?? 'no refresh token', json.error_description]
          .filter(Boolean)
          .join(': ');
        console.error('Google sign-in failed:', error);
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    const refreshTokenKey = getRefreshTokenKey(signIn);

    if (refreshToken) {
      await chrome.storage.local.set({ [refreshTokenKey]: refreshToken });
    }

    // One sign-in is enough: the others for the same refresh token close with
    // it, and their waiting runs retry with the refresh token this one stored.
    const status = refreshToken ? 'done' : 'failed';
    const closing = refreshToken
      ? signIns.filter(each => isPendingForRefreshToken(each, refreshTokenKey))
      : [signIn];

    await setSignIns(
      signIns.map(each =>
        closing.includes(each) ? { ...each, status, error } : each
      )
    );

    const othersPending = signIns.some(
      each => each.status === 'pending' && !closing.includes(each)
    );

    if (!othersPending) {
      await removeRedirectRule();
    }

    // The tab Google sent back may have a new id from the one we opened.
    closing.forEach(each => closeTab(each.tabId));
    if (redirectTabId !== undefined) {
      closeTab(redirectTabId);
    }
    if (signIn.openerTabId !== undefined) {
      chrome.tabs.update(signIn.openerTabId, { active: true });
    }
  }

  return Boolean(refreshToken);
};
