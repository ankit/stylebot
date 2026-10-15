// Builds the extension and uploads it to the Edge Add-ons draft submission,
// to publish from Partner Center.
//
//   yarn upload:edge

import { edgeEnv, uploadToEdge } from '../stores/edge.mjs';
import {
  packageChromium,
  prepareUpload,
  runUpload,
} from '../stores/shared.mjs';

runUpload(async () => {
  const version = prepareUpload(edgeEnv);
  const link = await uploadToEdge(packageChromium(version));

  return `Uploaded ${version} to the draft. Publish it from ${link}`;
});
