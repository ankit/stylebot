import fs from 'node:fs';

// Headers that described the body as it came over the wire, not as the HAR keeps it.
const WIRE_HEADERS = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
];

/**
 * Serves every request the HARs recorded from them, for the whole browser,
 * and lets the rest through. Playwright's own HAR routing works per page,
 * and misses tabs the extension opens in a window of its own until they've
 * loaded, such as the CLI's.
 */
export const replayHars = async (browser, hars) => {
  const entries = new Map();
  for (const har of hars) {
    for (const entry of JSON.parse(fs.readFileSync(har, 'utf8')).log.entries) {
      const key = `${entry.request.method} ${entry.request.url}`;
      if (!entries.has(key)) {
        entries.set(key, entry);
      }
    }
  }

  const cdp = await browser.newBrowserCDPSession();
  cdp.on('Fetch.requestPaused', ({ requestId, request }) => {
    const entry = entries.get(`${request.method} ${request.url}`);
    if (!entry) {
      cdp.send('Fetch.continueRequest', { requestId }).catch(() => undefined);
      return;
    }

    const { status, headers, content } = entry.response;
    const text = content.text ?? '';
    cdp
      .send('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: headers.filter(
          ({ name }) =>
            !name.startsWith(':') && !WIRE_HEADERS.includes(name.toLowerCase())
        ),
        body:
          content.encoding === 'base64'
            ? text
            : Buffer.from(text).toString('base64'),
      })
      .catch(() => undefined);
  });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
};
