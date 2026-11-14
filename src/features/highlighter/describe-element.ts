import { getClassNameSpans, looksGeneratedId } from '@stylebot/css';
import type { ClassNameSpan } from '@stylebot/css';

const MAX_CLASSES = 3;

export type NamePart = Array<ClassNameSpan>;

/**
 * A class as a part of the name, its `.` generated only when the whole
 * class is.
 */
const describeClass = (spans: NamePart): NamePart => [
  { text: '.', generated: spans.every(span => span.generated) },
  ...spans,
];

/**
 * The classes worth naming, those with an authored name first, kept in the
 * page's order.
 */
const pickClasses = (el: Element): Array<NamePart> => {
  const classes = Array.from(el.classList).map(getClassNameSpans);
  const authored = classes.filter(spans => spans.some(span => !span.generated));
  const picked = new Set(
    [...authored, ...classes.filter(spans => !authored.includes(spans))].slice(
      0,
      MAX_CLASSES
    )
  );

  return classes.filter(spans => picked.has(spans));
};

/**
 * Names an element the way dev tools do, as the parts of e.g.
 * `a#top.storylink`: its tag, id and first few classes, marking what a build
 * tool generated so the authored names stand out.
 */
export const describeElement = (el: Element): Array<NamePart> => {
  const id = el.getAttribute('id');
  const classes = pickClasses(el).map(describeClass);

  return [
    [{ text: el.tagName.toLowerCase(), generated: false }],
    ...(id ? [[{ text: `#${id}`, generated: looksGeneratedId(id) }]] : []),
    ...classes,
  ];
};

/**
 * The element's rendered size in css pixels, e.g. `120 × 24`.
 */
export const describeSize = (el: Element): string => {
  const { width, height } = el.getBoundingClientRect();

  return `${Math.round(width)} × ${Math.round(height)}`;
};
