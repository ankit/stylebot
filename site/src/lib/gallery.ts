import type { ImageMetadata } from 'astro';
import shotGithubSolarized from '../assets/gallery/github/solarized.png';
import shotGithubTerminal from '../assets/gallery/github/terminal.png';
import shotGithubDracula from '../assets/gallery/github/dracula.png';
import shotGmail from '../assets/gallery/gmail/midnight.png';
import shotHnNewspaper from '../assets/gallery/hn/newspaper.png';
import shotHnNewspaperDark from '../assets/gallery/hn/newspaper-dark.png';
import shotHnNightShift from '../assets/gallery/hn/night-shift.png';
import shotNytimesMorning from '../assets/gallery/nytimes/morning.png';
import shotNytimesNight from '../assets/gallery/nytimes/night.png';
import shotNytimes from '../assets/gallery/nytimes/midnight.png';
import shotWikipediaParchment from '../assets/gallery/wikipedia/parchment.png';
import shotWikipediaSlate from '../assets/gallery/wikipedia/slate.png';
import cssWikipediaParchment from '../assets/gallery/wikipedia/parchment.css?raw';
import cssWikipediaSlate from '../assets/gallery/wikipedia/slate.css?raw';
import cssGithubSolarized from '../assets/gallery/github/solarized.css?raw';
import cssGithubDracula from '../assets/gallery/github/dracula.css?raw';
import cssGithubTerminal from '../assets/gallery/github/terminal.css?raw';
import cssNytimes from '../assets/gallery/nytimes/midnight.css?raw';
import cssNytimesMorning from '../assets/gallery/nytimes/morning.css?raw';
import cssNytimesNight from '../assets/gallery/nytimes/night.css?raw';
import cssHnNewspaper from '../assets/gallery/hn/newspaper.css?raw';
import cssHnNewspaperDark from '../assets/gallery/hn/newspaper-dark.css?raw';
import cssHnNightShift from '../assets/gallery/hn/night-shift.css?raw';
import cssGmail from '../assets/gallery/gmail/midnight.css?raw';

export type GalleryTheme = {
  name: string;
  colors: [string, string];
  image: ImageMetadata;
} & (
  | { css: string; file: string; note?: never }
  | { note: string; css?: never; file?: never }
);

export type GallerySite = {
  id: string;
  site: string;
  url: string;
  themes: GalleryTheme[];
};

export const GALLERY: GallerySite[] = [
  {
    id: 'wikipedia',
    site: 'Wikipedia',
    url: 'wikipedia.org',
    themes: [
      {
        name: 'Parchment & Ink',
        colors: ['#f4ecd8', '#55607a'],
        image: shotWikipediaParchment,
        css: cssWikipediaParchment,
        file: 'wikipedia/parchment.css',
      },
      {
        name: 'Slate & Ash',
        colors: ['#1c1d22', '#8fa2e0'],
        image: shotWikipediaSlate,
        css: cssWikipediaSlate,
        file: 'wikipedia/slate.css',
      },
    ],
  },
  {
    id: 'github',
    site: 'GitHub',
    url: 'github.com',
    themes: [
      {
        name: 'Dracula',
        colors: ['#282a36', '#bd93f9'],
        image: shotGithubDracula,
        css: cssGithubDracula,
        file: 'github/dracula.css',
      },
      {
        name: 'Solarized Light',
        colors: ['#fdf6e3', '#268bd2'],
        image: shotGithubSolarized,
        css: cssGithubSolarized,
        file: 'github/solarized.css',
      },
      {
        name: 'Terminal',
        colors: ['#0a0f0a', '#3ddc5f'],
        image: shotGithubTerminal,
        css: cssGithubTerminal,
        file: 'github/terminal.css',
      },
    ],
  },
  {
    id: 'nytimes',
    site: 'The New York Times',
    url: 'nytimes.com',
    themes: [
      {
        name: 'Midnight Edition',
        colors: ['#1b1b24', '#9aa8ff'],
        image: shotNytimes,
        css: cssNytimes,
        file: 'nytimes/midnight.css',
      },
      {
        name: 'Morning Edition',
        colors: ['#f6efe0', '#121212'],
        image: shotNytimesMorning,
        css: cssNytimesMorning,
        file: 'nytimes/morning.css',
      },
      {
        name: 'Night Edition',
        colors: ['#1a1714', '#e0a24a'],
        image: shotNytimesNight,
        css: cssNytimesNight,
        file: 'nytimes/night.css',
      },
    ],
  },
  {
    id: 'hn',
    site: 'Hacker News',
    url: 'news.ycombinator.com',
    themes: [
      {
        name: 'Newspaper',
        colors: ['#e9e6df', '#3a3f4b'],
        image: shotHnNewspaper,
        css: cssHnNewspaper,
        file: 'hn/newspaper.css',
      },
      {
        name: 'Newspaper Dark',
        colors: ['#171d2b', '#9b8f6e'],
        image: shotHnNewspaperDark,
        css: cssHnNewspaperDark,
        file: 'hn/newspaper-dark.css',
      },
      {
        name: 'Night Shift',
        colors: ['#282a36', '#bd93f9'],
        image: shotHnNightShift,
        css: cssHnNightShift,
        file: 'hn/night-shift.css',
      },
    ],
  },
  {
    id: 'gmail',
    site: 'Gmail',
    url: 'mail.google.com',
    themes: [
      {
        name: 'Midnight Mailroom',
        colors: ['#1a1b26', '#7aa2f7'],
        image: shotGmail,
        css: cssGmail,
        file: 'gmail/midnight.css',
      },
    ],
  },
];
