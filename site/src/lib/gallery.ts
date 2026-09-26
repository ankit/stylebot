import type { ImageMetadata } from 'astro';
import github from '../assets/gallery/gallery-github.png';
import hn from '../assets/gallery/gallery-hn.png';
import nytimes from '../assets/gallery/gallery-nytimes.png';
import wikipedia from '../assets/gallery/gallery-wikipedia.png';

export type GalleryItem = {
  id: string;
  name: string;
  site: string;
  image: ImageMetadata;
  css: string;
};

export const GALLERY: GalleryItem[] = [
  {
    id: 'wikipedia',
    name: 'Readability',
    site: 'wikipedia.org',
    image: wikipedia,
    css: `/* Wikipedia: Readability */
body { background: #f9f8f5; }
.mw-body, #content {
  max-width: 42em;
  margin: 0 auto;
  font-family: "Source Serif 4", Georgia, serif;
  font-size: 20px;
  line-height: 1.7;
  color: #222;
}
.vector-header-container, #mw-panel, .mw-editsection, #footer { display: none; }
a { color: #0b63ce; }`,
  },
  {
    id: 'github',
    name: 'Monospace everything',
    site: 'github.com',
    image: github,
    css: `/* GitHub: Monospace everything */
* { font-family: "JetBrains Mono", "Fira Code", ui-monospace, monospace !important; }`,
  },
  {
    id: 'nytimes',
    name: 'Dark mode',
    site: 'nytimes.com',
    image: nytimes,
    css: `/* NYTimes: Dark mode */
body, header, nav, #site-content { background: #1b1b24 !important; }
h1, h2, h3, p, span { color: #e6e6ea !important; }
a { color: #9aa8ff !important; }
hr, [class*="divider"] { border-color: #34344a !important; }`,
  },
  {
    id: 'hn',
    name: 'Dracula',
    site: 'news.ycombinator.com',
    image: hn,
    css: `/* Hacker News: Dracula */
body, #hnmain { background: #282a36 !important; }
#hnmain > tbody > tr:first-child > td { background: #bd93f9 !important; }
* { font-family: "Fira Code", monospace; }
.titleline > a { color: #f8f8f2; }
.titleline > a:visited { color: #ff79c6; }
.sitestr, .sitebit a { color: #8be9fd; }
.score { color: #50fa7b; }
.subtext, .subtext a, .rank { color: #6272a4; }`,
  },
];
