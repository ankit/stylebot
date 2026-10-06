import type { VueConstructor } from 'vue';

import CalmPreview from './CalmPreview.vue';
import CompactPreview from './CompactPreview.vue';
import CozyPreview from './CozyPreview.vue';
import DarkModePreview from './DarkModePreview.vue';
import EasierToReadPreview from './EasierToReadPreview.vue';
import FocusModePreview from './FocusModePreview.vue';
import HideDistractionsPreview from './HideDistractionsPreview.vue';
import HideSidebarPreview from './HideSidebarPreview.vue';
import LightModePreview from './LightModePreview.vue';
import LinksInColorPreview from './LinksInColorPreview.vue';
import MorningNewspaperPreview from './MorningNewspaperPreview.vue';
import NightOwlPreview from './NightOwlPreview.vue';
import PaperAndInkPreview from './PaperAndInkPreview.vue';
import ReadLikeABookPreview from './ReadLikeABookPreview.vue';
import SurpriseMePreview from './SurpriseMePreview.vue';
import SwissPosterPreview from './SwissPosterPreview.vue';
import TerminalPreview from './TerminalPreview.vue';
import UnpinHeaderPreview from './UnpinHeaderPreview.vue';
import WabiSabiPreview from './WabiSabiPreview.vue';

// The preview drawn for each suggestion, by its id.
export const SUGGESTION_PREVIEWS: Record<string, VueConstructor> = {
  'paper-and-ink': PaperAndInkPreview,
  'wabi-sabi': WabiSabiPreview,
  terminal: TerminalPreview,
  'morning-newspaper': MorningNewspaperPreview,
  'swiss-poster': SwissPosterPreview,
  'night-owl': NightOwlPreview,
  cozy: CozyPreview,
  calm: CalmPreview,
  'links-in-color': LinksInColorPreview,
  'surprise-me': SurpriseMePreview,
  compact: CompactPreview,
  'light-mode': LightModePreview,
  'dark-mode': DarkModePreview,
  'easier-to-read': EasierToReadPreview,
  book: ReadLikeABookPreview,
  focus: FocusModePreview,
  'unpin-header': UnpinHeaderPreview,
  'hide-sidebar': HideSidebarPreview,
  'hide-distractions': HideDistractionsPreview,
};
