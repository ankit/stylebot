// A minimal App Store Connect API client, signed with the API key that
// APP_STORE_CONNECT_KEY_PATH, _KEY_ID and _ISSUER_ID point to.

import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const API = 'https://api.appstoreconnect.apple.com';

const base64url = value =>
  (Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value)))
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

/**
 * A token for the API, valid for 20 minutes, the longest Apple allows.
 */
const createToken = () => {
  const {
    APP_STORE_CONNECT_KEY_PATH: keyPath,
    APP_STORE_CONNECT_KEY_ID: keyId,
    APP_STORE_CONNECT_ISSUER_ID: issuerId,
  } = process.env;

  if (!keyPath || !keyId || !issuerId) {
    console.error(
      'Set APP_STORE_CONNECT_KEY_PATH, APP_STORE_CONNECT_KEY_ID and ' +
        'APP_STORE_CONNECT_ISSUER_ID to an App Store Connect API key.'
    );
    process.exit(1);
  }

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url({
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT',
  })}.${base64url({
    iss: issuerId,
    iat: now,
    exp: now + 20 * 60,
    aud: 'appstoreconnect-v1',
  })}`;
  const signature = sign('sha256', Buffer.from(unsigned), {
    key: createPrivateKey(readFileSync(keyPath)),
    dsaEncoding: 'ieee-p1363',
  });

  return `${unsigned}.${base64url(signature)}`;
};

let token;
let tokenCreatedAt = 0;

/**
 * Calls the API and returns its parsed JSON, throwing with Apple's error
 * details when the request fails.
 */
export const request = async (method, pathname, body) => {
  if (Date.now() - tokenCreatedAt > 15 * 60 * 1000) {
    token = createToken();
    tokenCreatedAt = Date.now();
  }

  const response = await fetch(
    pathname.startsWith('http') ? pathname : `${API}${pathname}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body && JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try {
      detail = JSON.parse(text)
        .errors.map(error => `${error.title}: ${error.detail}`)
        .join('\n');
    } catch {
      // Not JSON, so the raw text is the best detail there is.
    }
    throw new Error(`${method} ${pathname} → ${response.status}\n${detail}`);
  }

  return response.status === 204 ? null : response.json();
};

/**
 * Every item of a list endpoint, following its pages.
 */
export const getAll = async pathname => {
  const items = [];
  let next = pathname;

  while (next) {
    const { data, links } = await request('GET', next);
    items.push(...data);
    next = links?.next;
  }

  return items;
};
