import { runGoogleDriveSync } from '@stylebot/sync';
import type { RunGoogleDriveSyncResponse } from '@stylebot/types';

import { runMigrations } from './migrations';
import * as styleStorage from './styles';

/**
 * Syncs the styles once the migrations are done. A sync can start as the
 * background wakes (on browser start, an alarm, coming back from idle), and
 * must never read or upload data a migration has yet to repair.
 */
export const syncStyles = async (
  options: Parameters<typeof runGoogleDriveSync>[1]
): Promise<RunGoogleDriveSyncResponse> => {
  await runMigrations();
  return runGoogleDriveSync(styleStorage, options);
};
