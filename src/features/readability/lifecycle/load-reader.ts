type MountReader = () => Promise<void>;

// The readability/reader bundle sets stylebotMountReader once it has run.
export type ReaderWindow = Window & { stylebotMountReader?: MountReader };

let loading: Promise<MountReader> | null = null;

/**
 * Loads the reader's mount code, which ships as its own bundle so the content
 * scripts don't carry Defuddle and the reader UI on pages that never use it.
 * A failed load is forgotten, so the next apply tries again.
 */
export const loadReader = (): Promise<MountReader> => {
  if (!loading) {
    const url = chrome.runtime.getURL('readability/reader.js');

    loading = import(/* webpackIgnore: true */ url).then(
      () => {
        const mount = (window as ReaderWindow).stylebotMountReader;

        if (!mount) {
          throw new Error('readability/reader.js did not register the reader');
        }

        return mount;
      },
      (e: unknown) => {
        loading = null;
        throw e;
      }
    );
  }

  return loading;
};
