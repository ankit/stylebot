import { syncError } from '../errors';

export const DESKTOP_CLIENT_ID =
  '662998053209-uqalajpc4ei0nvdk164lmul35nbeocas.apps.googleusercontent.com';

// Set at build time so it stays out of the repo; Google treats a Desktop
// client's secret as public, since it ships in every copy of the extension.
const DESKTOP_CLIENT_SECRET = process.env.STYLEBOT_GOOGLE_CLIENT_SECRET ?? '';

// Never reached: a redirect rule sends it to the extension's own page first.
const REDIRECT_URI = 'http://127.0.0.1/stylebot-auth';
const REDIRECT_PAGE = 'google-sign-in/index.html';
const REDIRECT_RULE_ID = 1;

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const REFRESH_TOKEN_KEY = 'google-drive-refresh-token';

export type IssuedToken = { token: string; expiresIn: number };

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
};

/**
 * Whether sign-in has to go through a tab: Safari has no identity API, so
 * there's no browser-run auth window to open.
 */
export const usesTabSignIn = (): boolean => !chrome.identity?.launchWebAuthFlow;

const base64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomString = (): string =>
  base64Url(crypto.getRandomValues(new Uint8Array(32)));

const challengeFor = async (verifier: string): Promise<string> =>
  base64Url(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    )
  );

const requestToken = async (
  params: Record<string, string>
): Promise<TokenResponse> => {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DESKTOP_CLIENT_ID,
      client_secret: DESKTOP_CLIENT_SECRET,
      ...params,
    }),
  });

  return response.json();
};

const toIssuedToken = (json: TokenResponse): IssuedToken | null =>
  json.access_token
    ? {
        token: json.access_token,
        expiresIn:
          json.expires_in && json.expires_in > 0 ? json.expires_in : 3600,
      }
    : null;

/**
 * Trades the stored refresh token for a new access token, without the user.
 * Resolves null when there's none, or Google no longer honours it.
 */
export const refreshAccessToken = async (): Promise<IssuedToken | null> => {
  const items = await chrome.storage.local.get(REFRESH_TOKEN_KEY);
  const refreshToken: string | undefined = items[REFRESH_TOKEN_KEY];

  if (!refreshToken) {
    return null;
  }

  const json = await requestToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  if (json.error === 'invalid_grant') {
    await chrome.storage.local.remove(REFRESH_TOKEN_KEY);
  }

  return toIssuedToken(json);
};

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

type SignIn = {
  state: string;
  verifier: string;
  tabId: number;
  openerTabId?: number;
  status: 'pending' | 'done' | 'failed';
};

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
        reject(syncError('Authorization failure', 'auth'));
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
        reject(syncError('Sign-in window closed', 'auth'));
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
 * already open so a second sync doesn't start a second sign-in.
 */
const startSignIn = async (scopes: Array<string>): Promise<number> => {
  const signIns = await getSignIns();

  for (const signIn of signIns) {
    if (signIn.status === 'pending' && (await isTabOpen(signIn.tabId))) {
      chrome.tabs.update(signIn.tabId, { active: true });
      return signIn.tabId;
    }
  }

  const verifier = randomString();
  const state = randomString();

  const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authURL.search = new URLSearchParams({
    client_id: DESKTOP_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    code_challenge: await challengeFor(verifier),
    code_challenge_method: 'S256',
    state,
    // A refresh token only comes with offline access, and on a repeat
    // sign-in only when the consent screen is shown again.
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

  const [opener] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  await addRedirectRule();
  const tab = await chrome.tabs.create({ url: authURL.toString() });
  const tabId = tab.id as number;

  await setSignIns([
    ...signIns.filter(each => each.status === 'pending'),
    { state, verifier, tabId, openerTabId: opener?.id, status: 'pending' },
  ]);

  return tabId;
};

let opening: Promise<number> | null = null;

/**
 * Overlapping calls in one background share a single tab.
 */
const openSignInTab = (scopes: Array<string>): Promise<number> => {
  opening =
    opening ??
    startSignIn(scopes).then(
      tabId => {
        opening = null;
        return tabId;
      },
      e => {
        opening = null;
        throw e;
      }
    );

  return opening;
};

/**
 * Signs in to Google in a tab and resolves with a fresh access token once
 * the background has stored the refresh token the sign-in returned.
 */
export const signInInTab = async (
  scopes: Array<string>
): Promise<IssuedToken> => {
  const tabId = await openSignInTab(scopes);
  await waitForSignIn(tabId);

  const issued = await refreshAccessToken();
  if (!issued) {
    throw syncError('Authorization failure', 'auth');
  }

  return issued;
};

/**
 * Finishes a sign-in from the URL Google redirected its tab to: matches it
 * to a sign-in we started, trades the code for a refresh token, and closes
 * every sign-in tab, including the redirected one. Resolves whether a
 * sign-in completed.
 */
export const completeTabSignIn = async (
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

  try {
    if (code) {
      const json = await requestToken({
        grant_type: 'authorization_code',
        code,
        code_verifier: signIn.verifier,
        redirect_uri: REDIRECT_URI,
      });
      refreshToken = json.refresh_token;
    }
  } finally {
    if (refreshToken) {
      await chrome.storage.local.set({ [REFRESH_TOKEN_KEY]: refreshToken });
    }

    // One sign-in is enough: the others' tabs close with it, and their
    // waiting runs retry with the refresh token this one stored.
    const status = refreshToken ? 'done' : 'failed';
    const closing = refreshToken
      ? signIns.filter(each => each.status === 'pending')
      : [signIn];

    await setSignIns(
      signIns.map(each => (closing.includes(each) ? { ...each, status } : each))
    );
    await removeRedirectRule();

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
