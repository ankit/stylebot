import { getPageOutline } from '@stylebot/page-bridge';
import type { PageInspection } from '@stylebot/types';

/**
 * Answers what the background asks about the page, with the same readers
 * the editor and Chat use.
 */
export const inspectPage = async (
  inspection: PageInspection
): Promise<string> => {
  switch (inspection.kind) {
    case 'outline':
      return getPageOutline();
  }
};
