// Entry for readability/reader.js, which load-reader.ts imports on demand.
import './scss/index.scss';

import type { ReaderWindow } from '@stylebot/readability';
import { mountReader } from './mount-reader';

(window as ReaderWindow).stylebotMountReader = mountReader;
