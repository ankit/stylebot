export interface Quote {
  text: string;
  name: string;
  from: string;
}

export const QUOTES: Quote[] = [
  {
    text: 'Thank you for creating this — this tool lets me make inaccessible sites more accessible for me',
    name: 'James',
    from: 'Ko-fi',
  },
  {
    text: 'This extension is awesome and I have used it for many years. Good to see it’s getting updates again.',
    name: 'Frank',
    from: 'Chrome Web Store',
  },
  {
    text: 'Stylebot is one of the first extensions I install on any new build. It massively improves my browsing experience. Thanks.',
    name: 'mac',
    from: 'Ko-fi',
  },
  {
    text: 'Imagine making your own dark mode version of a website that doesn’t have it. This add-on is amazing.',
    name: 'blackwaltz',
    from: 'Firefox Add-ons',
  },
  {
    text: 'Thank you for developing this. It makes it possible for me to adjust font sizes in Google Mail and Chat.',
    name: 'Mike',
    from: 'Ko-fi',
  },
  {
    text: 'Perfect for fixing awful UI decisions',
    name: 'Ivan',
    from: 'Chrome Web Store',
  },
  {
    text: 'Stylebot has improved my browsing experience in countless sites for years now. Love to see the active development picking up again!',
    name: 'Waldir',
    from: 'Ko-fi',
  },
  {
    text: 'I never write reviews. But this extension is gold. I created account just to say thank you.',
    name: 'Jonny',
    from: 'Firefox Add-ons',
  },
  {
    text: 'Many thanks! This has saved my eyes from strain …',
    name: 'Tom',
    from: 'Ko-fi',
  },
  {
    text: 'My favorite extension of all time for overriding bad CSS and making my web experience more enjoyable :)',
    name: 'Patrick',
    from: 'Chrome Web Store',
  },
  {
    text: 'Stylebot is the most useful and convenient client-side CSS extension I have used over the last twenty years. It is one of the best browser extensions, full stop.',
    name: '',
    from: 'Ko-fi',
  },
  {
    text: 'Finally a working and easy sidebar blocker',
    name: 'Tatu',
    from: 'Chrome Web Store',
  },
  {
    text: 'Thank you for a brilliant extension! It has helped me make websites much more usable.',
    name: 'PJ',
    from: 'Ko-fi',
  },
  {
    text: 'I’ve been using Stylebot with great success. So much so that when I visit sites on other peoples machines it takes me a minute to figure out why certain sites are so hideous',
    name: '91bananas',
    from: 'Hacker News',
  },
  {
    text: 'I can’t imagine using Chrome without this extension.',
    name: 'Thomas',
    from: 'Chrome Web Store',
  },
  {
    text: 'I love this extension! I use it to simplify websites.',
    name: 'Atsushi',
    from: 'Chrome Web Store',
  },
  {
    text: 'Simple, easy, and works well.',
    name: 'Jeremy',
    from: 'Chrome Web Store',
  },
  {
    text: 'Perfect for improving bad written css :D',
    name: 'Ioan',
    from: 'Chrome Web Store',
  },
  {
    text: 'Lets me edit live css on the page, thanks!',
    name: 'David',
    from: 'Chrome Web Store',
  },
];

/**
 * Quotes over this many characters get a smaller type size so the cards in a
 * row stay close in height.
 */
export const LONG_QUOTE = 130;
