import { format } from 'date-fns';
import { Timestamp } from '@stylebot/types';

export const getCurrentTimestamp = (): Timestamp =>
  format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
