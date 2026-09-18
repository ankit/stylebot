import { formatDistanceToNow } from 'date-fns';

/**
 * date-fns throws RangeError on an invalid date, which is reachable whenever
 * stored sync metadata is missing or malformed.
 */
export const formatSyncTime = (value?: string): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatDistanceToNow(date, { addSuffix: true });
};
