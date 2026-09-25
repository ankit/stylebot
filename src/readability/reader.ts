// Entry for readability/reader.js, which load-reader.ts imports on demand.
import './scss/index.scss';

import type { ReaderWindow } from './lifecycle/load-reader';
import { mountReader } from './lifecycle/mount-reader';

(window as ReaderWindow).stylebotMountReader = mountReader;
