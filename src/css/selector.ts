export const getClassBasedSelector = (el: HTMLElement): string | null => {
  const className = el
    .getAttribute('class')
    ?.trim()
    .replace(/\s{2,}/g, ' ');

  if (className) {
    const classes = className.split(' ');
    const len = classes.length;

    let selector = el.tagName.toLowerCase();
    for (let i = 0; i < len; i++) {
      // todo: optimize class selection to be more specific here
      selector += '.' + classes[i];
    }

    return selector;
  }

  return null;
};

export const getIdBasedSelector = (el: HTMLElement): string | null => {
  const id = el.getAttribute('id');
  if (id) {
    return `#${id}`;
  }

  return null;
};

export const getTagNameBasedSelector = (
  el: HTMLElement,
  domHeirarchyLevel = 0
): string => {
  const tagName = el.tagName.toLowerCase();

  // don't go beyond 2 levels up the DOM
  if (domHeirarchyLevel < 2 && el.parentElement) {
    const parent = el.parentElement;
    const parentSelector = getTagNameBasedSelector(
      parent,
      domHeirarchyLevel + 1
    );

    return `${parentSelector} ${tagName}`;
  }

  return tagName;
};

export const getSelector = (el: HTMLElement): string => {
  let selector = getClassBasedSelector(el);

  if (!selector) {
    selector = getIdBasedSelector(el);
  }

  if (!selector) {
    return getTagNameBasedSelector(el);
  }

  return selector;
};

export const validateSelector = (selector: string): boolean => {
  if (!selector) {
    return false;
  }

  try {
    document.querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
};
