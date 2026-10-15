// Uploads a package to the Edge Add-ons draft submission, with the Add-ons
// API v1.1. Publishing it stays a step in Partner Center.

import { openAsBlob } from 'node:fs';

import { poll, readJson, requireEnv } from './shared.mjs';

const API = 'https://api.addons.microsoftedge.microsoft.com/v1';

export const edgeEnv = [
  'EDGE_ADDONS_PRODUCT_ID',
  'EDGE_ADDONS_CLIENT_ID',
  'EDGE_ADDONS_API_KEY',
];

/**
 * Uploads the zip and waits until the draft has been updated with it.
 */
export const uploadToEdge = async zipPath => {
  const env = requireEnv(edgeEnv);
  const headers = {
    Authorization: `ApiKey ${env.EDGE_ADDONS_API_KEY}`,
    'X-ClientID': env.EDGE_ADDONS_CLIENT_ID,
  };
  const packagePath = `${API}/products/${env.EDGE_ADDONS_PRODUCT_ID}/submissions/draft/package`;

  const response = await fetch(packagePath, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/zip' },
    body: await openAsBlob(zipPath),
  });

  if (response.status !== 202) {
    await readJson(response, 'Edge Add-ons upload');
    throw new Error(`Edge Add-ons upload returned ${response.status}`);
  }

  const operationId = response.headers.get('Location').split('/').pop();

  await poll('Edge Add-ons', async () => {
    const operation = await readJson(
      await fetch(`${packagePath}/operations/${operationId}`, { headers }),
      'Edge Add-ons status'
    );

    if (operation.status === 'Failed') {
      throw new Error(
        `Edge Add-ons upload failed: ${operation.message} ${JSON.stringify(
          operation.errors ?? []
        )}`
      );
    }

    return operation.status === 'Succeeded';
  });

  return 'https://partner.microsoft.com/dashboard/microsoftedge/overview';
};
