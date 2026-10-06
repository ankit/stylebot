import type { StyleMap } from '@stylebot/types';
import { createBackup, getBackupFilename } from '@stylebot/saved-styles';
import { getCurrentTimestamp } from '@stylebot/utils';

/**
 * Asks for a backup file and resolves with its text, or with null when the
 * picker is closed without choosing one.
 */
export const pickBackupFile = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';

    fileInput.addEventListener('cancel', () => resolve(null));
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];

      if (!file) {
        resolve(null);
        return;
      }

      file.text().then(resolve, reject);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    fileInput.remove();
  });
};

/**
 * Downloads the styles as a dated backup file.
 */
export const downloadBackup = (styles: StyleMap): void => {
  const backup = createBackup(styles, getCurrentTimestamp());
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.href = url;
  downloadAnchorNode.download = getBackupFilename(new Date());
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  // Revoking in the same task can cancel the download before it reads the blob.
  setTimeout(() => URL.revokeObjectURL(url));
};
