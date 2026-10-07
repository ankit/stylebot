import { inspectPage } from './inspect-page';
import type { InspectorWindow } from './load-inspector';

(window as InspectorWindow).stylebotInspectPage = inspectPage;
