// Entry for cli-inspector/index.js, which load-inspector.ts imports on demand.
import type { InspectorWindow } from '@stylebot/types';

import { inspectPage } from './inspect-page';

(window as InspectorWindow).stylebotInspectPage = inspectPage;
