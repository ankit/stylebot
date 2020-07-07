/**
 * Generate CSS selector for HTML element.
 */
class CssSelectorGenerator {
  inspect = (el: HTMLElement, domHeirarchyLevel: number = 0): string => {
    const className = el
      .getAttribute('class')
      ?.trim()
      .replace(/\s{2,}/g, ' ');

    if (className) {
      const classes = className.split(' ');
      const len = classes.length;

      let selector = el.tagName.toLowerCase();
      for (var i = 0; i < len; i++) {
        // todo: optimize class selection to be more specific here
        selector += '.' + classes[i];
      }

      return selector;
    }

    const id = el.getAttribute('id');
    if (id) {
      return `#${id}`;
    }

    const tagName = el.tagName.toLowerCase();

    // don't go beyond 2 levels up the DOM
    if (domHeirarchyLevel < 2 && el.parentElement) {
      const parent = el.parentElement;
      const parentSelector = this.inspect(parent, domHeirarchyLevel + 1);

      return `${parentSelector} ${tagName}`;
    } else {
      return tagName;
    }
  };
}

export default CssSelectorGenerator;
