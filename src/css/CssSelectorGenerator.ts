/**
 * Generate CSS selector for HTML element.
 */
class CssSelectorGenerator {
  static getClassBasedSelector(el: HTMLElement): string | null {
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
  }

  static getIdBasedSelector(el: HTMLElement): string | null {
    const id = el.getAttribute('id');
    if (id) {
      return `#${id}`;
    }

    return null;
  }

  static getTagNameBasedSelector(
    el: HTMLElement,
    domHeirarchyLevel = 0
  ): string {
    const tagName = el.tagName.toLowerCase();

    // don't go beyond 2 levels up the DOM
    if (domHeirarchyLevel < 2 && el.parentElement) {
      const parent = el.parentElement;
      const parentSelector = CssSelectorGenerator.getTagNameBasedSelector(
        parent,
        domHeirarchyLevel + 1
      );

      return `${parentSelector} ${tagName}`;
    }

    return tagName;
  }

  static get = (el: HTMLElement): string => {
    let selector = CssSelectorGenerator.getClassBasedSelector(el);

    if (!selector) {
      selector = CssSelectorGenerator.getIdBasedSelector(el);
    }

    if (!selector) {
      return CssSelectorGenerator.getTagNameBasedSelector(el);
    }

    return selector;
  };
}

export default CssSelectorGenerator;
