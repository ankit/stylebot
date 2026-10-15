// Builds the extension and uploads it to the Chrome Web Store as a draft of
// the next version, to publish from the Developer Dashboard.
//
//   yarn upload:chrome

import { chromeEnv, uploadToChrome } from '../stores/chrome.mjs';
import {
  packageChromium,
  prepareUpload,
  runUpload,
} from '../stores/shared.mjs';

runUpload(async () => {
  const version = prepareUpload(chromeEnv);
  const link = await uploadToChrome(packageChromium(version));

  return `Uploaded ${version} as a draft. Publish it from ${link}`;
});
