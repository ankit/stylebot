// Uploads a package to addons.mozilla.org with the AMO API v5. AMO has no
// drafts: it validates the upload, and only submitting it as a new version,
// with its source and release notes, sends it to review.

import { createHmac, randomUUID } from 'node:crypto';
import { openAsBlob } from 'node:fs';
import path from 'node:path';

import { poll, readJson, requireEnv } from './shared.mjs';

const ADDON_ID = '{52bda3fd-dc48-4b3d-a7b9-58af57879f1e}';
const API = 'https://addons.mozilla.org/api/v5';

export const firefoxEnv = ['AMO_JWT_ISSUER', 'AMO_JWT_SECRET'];

const base64url = value => Buffer.from(value).toString('base64url');

/**
 * A short-lived HS256 token for AMO's Authorization header.
 */
const getAuthorization = env => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: env.AMO_JWT_ISSUER,
      jti: randomUUID(),
      iat: issuedAt,
      exp: issuedAt + 60,
    })
  );
  const signature = createHmac('sha256', env.AMO_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `JWT ${header}.${payload}.${signature}`;
};

/**
 * Sends a form to AMO, as multipart, and reads its JSON answer.
 */
const sendForm = async (env, url, method, fields, what) => {
  const form = new FormData();

  for (const [name, value] of Object.entries(fields)) {
    if (value.blob) {
      form.append(name, value.blob, value.name);
    } else {
      form.append(name, value);
    }
  }

  return readJson(
    await fetch(url, {
      method,
      headers: { Authorization: getAuthorization(env) },
      body: form,
    }),
    what
  );
};

/**
 * Uploads the zip and waits for AMO's validation. With submit, also creates
 * the version from it, with the source zip and release notes, which sends it
 * to review.
 */
export const uploadToFirefox = async (
  { extensionZip, sourceZip, releaseNotes },
  submit
) => {
  const env = requireEnv(firefoxEnv);
  const blobOf = async file => ({
    blob: await openAsBlob(file),
    name: path.basename(file),
  });

  const { uuid } = await sendForm(
    env,
    `${API}/addons/upload/`,
    'POST',
    { upload: await blobOf(extensionZip), channel: 'listed' },
    'AMO upload'
  );

  await poll('AMO', async () => {
    const upload = await readJson(
      await fetch(`${API}/addons/upload/${uuid}/`, {
        headers: { Authorization: getAuthorization(env) },
      }),
      'AMO upload status'
    );

    if (upload.processed && !upload.valid) {
      throw new Error(
        `AMO validation failed: ${JSON.stringify(upload.validation?.messages)}`
      );
    }

    return upload.processed;
  });

  if (!submit) {
    return null;
  }

  const addonUrl = `${API}/addons/addon/${encodeURIComponent(ADDON_ID)}`;

  const version = await readJson(
    await fetch(`${addonUrl}/versions/`, {
      method: 'POST',
      headers: {
        Authorization: getAuthorization(env),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        upload: uuid,
        release_notes: { 'en-US': releaseNotes },
        approval_notes:
          'Build steps are in AMO-BUILD.md at the root of the source zip.',
      }),
    }),
    'AMO version'
  );

  await sendForm(
    env,
    `${addonUrl}/versions/${version.id}/`,
    'PATCH',
    { source: await blobOf(sourceZip) },
    'AMO source upload'
  );

  return `https://addons.mozilla.org/developers/addon/${encodeURIComponent(
    ADDON_ID
  )}/versions/${version.id}`;
};
