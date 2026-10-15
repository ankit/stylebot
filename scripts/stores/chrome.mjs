// Uploads a package to the Chrome Web Store as a draft of the next version,
// with the Chrome Web Store API v2. Publishing it stays a step in the
// Developer Dashboard.

import { openAsBlob } from 'node:fs';

import { poll, readJson, requireEnv } from './shared.mjs';

const ITEM_ID = 'oiaejidbmkiecgbjeifoejpgmdaleoha';
const API = 'https://chromewebstore.googleapis.com';

export const chromeEnv = [
  'CHROME_WEB_STORE_PUBLISHER_ID',
  'CHROME_WEB_STORE_CLIENT_ID',
  'CHROME_WEB_STORE_CLIENT_SECRET',
  'CHROME_WEB_STORE_REFRESH_TOKEN',
];

/**
 * Trades the refresh token for an access token with the chromewebstore scope.
 */
const getAccessToken = async env => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.CHROME_WEB_STORE_CLIENT_ID,
      client_secret: env.CHROME_WEB_STORE_CLIENT_SECRET,
      refresh_token: env.CHROME_WEB_STORE_REFRESH_TOKEN,
    }),
  });
  const { access_token: accessToken } = await readJson(
    response,
    'Chrome Web Store sign-in'
  );

  return accessToken;
};

/**
 * Uploads the zip and waits until the store has processed it.
 */
export const uploadToChrome = async zipPath => {
  const env = requireEnv(chromeEnv);
  const headers = { Authorization: `Bearer ${await getAccessToken(env)}` };
  const itemPath = `publishers/${env.CHROME_WEB_STORE_PUBLISHER_ID}/items/${ITEM_ID}`;

  const response = await fetch(`${API}/upload/v2/${itemPath}:upload`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/zip' },
    body: await openAsBlob(zipPath),
  });
  const upload = await readJson(response, 'Chrome Web Store upload');

  if (upload.uploadState === 'IN_PROGRESS') {
    await poll('Chrome Web Store', async () => {
      const status = await readJson(
        await fetch(`${API}/v2/${itemPath}:fetchStatus`, { headers }),
        'Chrome Web Store status'
      );

      return getUploadResult(status.lastAsyncUploadState);
    });
  } else {
    getUploadResult(upload.uploadState, upload);
  }

  return 'https://chrome.google.com/webstore/devconsole';
};

/**
 * True once the upload succeeded, false while it's processing; throws if it
 * failed.
 */
const getUploadResult = (state, details) => {
  if (state === 'SUCCEEDED') {
    return true;
  }

  if (state === 'IN_PROGRESS') {
    return false;
  }

  throw new Error(
    `Chrome Web Store upload ${state ?? 'failed'}${
      details ? `: ${JSON.stringify(details)}` : ''
    }`
  );
};
