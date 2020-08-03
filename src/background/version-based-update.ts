import { set as setCommands } from './commands';
import { defaultCommands } from '@stylebot/settings';

const getVersion = (): Promise<string> => {
  return new Promise(resolve => {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', 'manifest.json');

    xmlhttp.onload = () => {
      const manifest = JSON.parse(xmlhttp.responseText);
      resolve(manifest.version);
    };

    xmlhttp.send(null);
  });
};

const apply_3_0_3_update = async () => {
  console.log('applying update for 3.0.3...');
  // override default global shortcuts for all existing users
  // since the previous default shortcuts conflict with languages
  // and easy to accidentally press.
  await setCommands(defaultCommands);
};

const versionBasedUpdate = async (): Promise<void> => {
  const version = await getVersion();
  const updateCompleteKey = `${version}_update_complete`;

  return new Promise(resolve => {
    chrome.storage.local.get(updateCompleteKey, async items => {
      if (items[updateCompleteKey]) {
        // update has already been applied.
        resolve();
        return;
      }

      if (version === '3.0.3') {
        await apply_3_0_3_update();
      }

      chrome.storage.local.set({ [updateCompleteKey]: true }, () => {
        resolve();
      });
    });
  });
};

export default versionBasedUpdate;
