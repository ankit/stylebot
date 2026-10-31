import fs from 'node:fs';
import path from 'node:path';

/**
 * Writes a PNG data url to a file, creating its folder, and returns the
 * file's absolute path.
 */
export const savePng = (dataUrl, file) => {
  const out = path.resolve(file);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  return out;
};
