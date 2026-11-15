import {
  getClassNameSpans,
  getNamingAttribute,
  looksGeneratedId,
} from '@stylebot/css';
import type { ClassNameSpan } from '@stylebot/css';

const MAX_CLASSES = 3;
const MAX_ATTRIBUTE_VALUE_LENGTH = 24;

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
const pickClasses = (classes: Array<NamePart>): Array<NamePart> => {
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
 * An attribute as a part of the name, e.g. `[aria-label="Search"]`, its
 * value cut short.
 */
const describeAttribute = (el: Element): NamePart | null => {
  const attribute = getNamingAttribute(el);
  if (!attribute) {
    return null;
  }

  const { name, value } = attribute;
  const shown =
    value.length > MAX_ATTRIBUTE_VALUE_LENGTH
      ? `${value.slice(0, MAX_ATTRIBUTE_VALUE_LENGTH - 1)}…`
      : value;

  return [{ text: `[${name}="${shown}"]`, generated: false }];
};

/**
 * Names an element the way dev tools do, as the parts of e.g.
 * `a#top.storylink`: its tag, id and first few classes, marking what a build
 * tool generated so the authored names stand out. With no authored name, it
 * names it by the attribute a selector would use instead, like
 * `[aria-label="Search"]`.
 */
export const describeElement = (el: Element): Array<NamePart> => {
  const id = el.getAttribute('id');
  const idPart = id
    ? [{ text: `#${id}`, generated: looksGeneratedId(id) }]
    : null;
  const classes = Array.from(el.classList).map(getClassNameSpans);
  const named = [idPart ?? [], ...classes].some(spans =>
    spans.some(span => !span.generated)
  );
  const attribute = named ? null : describeAttribute(el);

  return [
    [{ text: el.tagName.toLowerCase(), generated: false }],
    ...(idPart ? [idPart] : []),
    ...(attribute ? [attribute] : pickClasses(classes).map(describeClass)),
  ];
};
