/*
 * Checks measured on the page: whether a reply did what was asked, read from
 * computed styles and element boxes rather than judged from a screenshot.
 * The case format is described in docs/chat-evals.md.
 */

const MAX_ELEMENTS = 60;
const COLOR_TOLERANCE = 16;
const NUMBER_TOLERANCE = 0.5;

/**
 * In the page: what each check needs from the elements its selector
 * matches, and whether each is visible. Colors come back as [r, g, b, a].
 */
function readChecks(checks, limit) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  const rgba = value => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = '#000';
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };

  const over = (top, bottom) => {
    const alpha = top[3] + bottom[3] * (1 - top[3]);
    if (!alpha) {
      return [0, 0, 0, 0];
    }
    return [
      ...[0, 1, 2].map(
        i => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / alpha
      ),
      alpha,
    ];
  };

  // The color behind an element's text: its own and its ancestors' backgrounds.
  const background = element => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const layer = rgba(getComputedStyle(node).backgroundColor);
      if (layer[3]) {
        layers.push(layer);
      }
      if (layer[3] === 1) {
        break;
      }
    }
    return layers.reduceRight(
      (below, layer) => over(layer, below),
      [255, 255, 255, 1]
    );
  };

  const luminance = ([r, g, b]) => {
    const [R, G, B] = [r, g, b].map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };

  const visible = element => {
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      element.checkVisibility({
        visibilityProperty: true,
        opacityProperty: true,
      })
    );
  };

  const read = (element, prop) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    switch (prop) {
      case '@width':
        return rect.width;
      case '@height':
        return rect.height;
      case '@top':
        return rect.top + scrollY;
      case '@left':
        return rect.left;
      case '@offcenter':
        return Math.abs(
          rect.left + rect.width / 2 - document.documentElement.clientWidth / 2
        );
      case '@fill': {
        const parent = element.parentElement;
        const box = getComputedStyle(parent);
        const inner =
          parent.clientWidth -
          parseFloat(box.paddingLeft) -
          parseFloat(box.paddingRight);
        return inner ? rect.width / inner : null;
      }
      case '@background':
        return background(element);
      case '@contrast': {
        const behind = background(element);
        const text = over(rgba(style.color), behind);
        const [light, dark] = [luminance(text), luminance(behind)].sort(
          (a, b) => b - a
        );
        return (light + 0.05) / (dark + 0.05);
      }
      default: {
        const value = style.getPropertyValue(prop);
        return /color$/.test(prop) ? rgba(value) : value;
      }
    }
  };

  return checks.map(check => {
    if (!check.selector) {
      return null;
    }

    const elements = [...document.querySelectorAll(check.selector)].slice(
      0,
      limit
    );
    const props = Object.keys(check.expect ?? {});

    const shown = elements.filter(visible);
    let columns = null;
    if (check.columns && shown.length) {
      const top = shown[0].getBoundingClientRect().top;
      columns = new Set(
        shown
          .filter(e => Math.abs(e.getBoundingClientRect().top - top) < 4)
          .map(e => Math.round(e.getBoundingClientRect().left))
      ).size;
    }

    // Whether an element stays inside its container and off its neighbours.
    const placement = element => {
      const box = element.closest(check.within);
      if (!box) {
        return { inside: false, overlaps: [] };
      }
      const rect = element.getBoundingClientRect();
      const outer = box.getBoundingClientRect();
      const inside =
        rect.left >= outer.left - 1 &&
        rect.right <= outer.right + 1 &&
        rect.top >= outer.top - 1 &&
        rect.bottom <= outer.bottom + 1;
      const overlaps = check.clear
        ? [...box.querySelectorAll(check.clear)]
            .filter(other => other !== element && visible(other))
            .filter(other => {
              const r = other.getBoundingClientRect();
              return (
                Math.min(rect.right, r.right) - Math.max(rect.left, r.left) >
                  1 &&
                Math.min(rect.bottom, r.bottom) - Math.max(rect.top, r.top) > 1
              );
            })
            .map(
              other =>
                other.tagName.toLowerCase() +
                (other.className
                  ? `.${String(other.className).split(' ')[0]}`
                  : '')
            )
        : [];
      return { inside, overlaps };
    };

    return {
      count: elements.length,
      columns,
      elements: elements.map(element => {
        const isVisible = visible(element);
        return {
          visible: isVisible,
          values: isVisible
            ? Object.fromEntries(props.map(prop => [prop, read(element, prop)]))
            : {},
          ...(isVisible && check.within ? placement(element) : {}),
        };
      }),
    };
  });
}

/**
 * Reads every check's measurements from the page as it is now.
 */
export const measureChecks = (page, checks) =>
  checks?.length
    ? page.evaluate(
        `(${readChecks.toString()})(${JSON.stringify(checks)}, ${MAX_ELEMENTS})`
      )
    : [];

const luminanceOf = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

const hexToRgb = hex => {
  const full =
    hex.length === 4
      ? hex
          .slice(1)
          .split('')
          .map(c => c + c)
          .join('')
      : hex.slice(1);
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
};

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const hueOf = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map(v => v / 255);
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const delta = max - min;
  const saturation = max ? delta / max : 0;
  if (!delta) {
    return { hue: 0, saturation };
  }
  let hue = (R - G) / delta + 4;
  if (max === R) {
    hue = ((G - B) / delta) % 6;
  } else if (max === G) {
    hue = (B - R) / delta + 2;
  }
  return { hue: (hue * 60 + 360) % 360, saturation };
};

const show = value => {
  if (Array.isArray(value)) {
    const alpha = value[3] < 1 ? `, ${value[3].toFixed(2)}` : '';
    return `rgb(${value
      .slice(0, 3)
      .map(v => Math.round(v))
      .join(', ')}${alpha})`;
  }
  return typeof value === 'number'
    ? String(Math.round(value * 100) / 100)
    : JSON.stringify(value);
};

/**
 * Whether one measured value meets an expectation, against the value it had
 * before any styling for the relative ones ("same", "darker", ">=1.2x").
 */
const meets = (expected, value, before) => {
  if (Array.isArray(expected)) {
    return expected.some(option => meets(option, value, before));
  }
  if (value === null || value === undefined) {
    return false;
  }

  const isColor = Array.isArray(value);

  if (expected === 'same') {
    if (isColor) {
      return (
        distance(value, before) <= 2 && Math.abs(value[3] - before[3]) < 0.05
      );
    }
    return typeof value === 'number'
      ? Math.abs(value - before) <= NUMBER_TOLERANCE
      : value === before;
  }

  if (isColor) {
    const lum = luminanceOf(value);
    if (expected === 'darker') {
      return lum < luminanceOf(before) - 0.02;
    }
    if (expected === 'lighter') {
      return lum > luminanceOf(before) + 0.02;
    }
    if (expected === 'dark') {
      return lum < 0.2;
    }
    if (expected === 'light') {
      return lum > 0.6;
    }
    const hue = expected.match(/^hue (\d+)-(\d+)$/);
    if (hue) {
      const { hue: h, saturation } = hueOf(value);
      return saturation > 0.25 && h >= Number(hue[1]) && h <= Number(hue[2]);
    }
    const hex = expected.match(/^(#[0-9a-f]{3}|#[0-9a-f]{6})(?:±(\d+))?$/i);
    if (hex) {
      return (
        value[3] > 0.9 &&
        distance(value, hexToRgb(hex[1])) <=
          (hex[2] ? Number(hex[2]) : COLOR_TOLERANCE)
      );
    }
    return false;
  }

  const regex = expected.match(/^\/(.+)\/([a-z]*)$/);
  if (regex) {
    return new RegExp(regex[1], regex[2]).test(String(value));
  }

  const numeric = expected.match(/^(<=|>=|<|>)?(-?[\d.]+)(?:±([\d.]+))?(x)?$/);
  if (numeric) {
    const [, op, n, tolerance, relative] = numeric;
    let actual = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(actual)) {
      return false;
    }
    if (relative) {
      const base = typeof before === 'number' ? before : parseFloat(before);
      if (!base) {
        return false;
      }
      actual /= base;
    }
    const target = Number(n);
    switch (op) {
      case '<':
        return actual < target;
      case '<=':
        return actual <= target;
      case '>':
        return actual > target;
      case '>=':
        return actual >= target;
      default:
        return (
          Math.abs(actual - target) <=
          (tolerance ? Number(tolerance) : NUMBER_TOLERANCE)
        );
    }
  }

  return String(value) === expected;
};

/**
 * Each check's verdict: whether it passed, and when it didn't, what the
 * page had instead.
 */
export const scoreChecks = (checks, before, after) =>
  (checks ?? []).map((check, index) => {
    const verdict = (pass, detail) => ({
      what: check.what,
      pass,
      ...(pass ? {} : { detail }),
    });

    const was = before[index];
    const now = after[index];

    if (!now.count) {
      return verdict(false, `nothing matches ${check.selector}`);
    }

    if (check.hidden === true) {
      const left = now.elements.filter(e => e.visible).length;
      return verdict(!left, `${left} of ${now.count} still visible`);
    }

    // The first element that showed before, which is the same element after.
    const first = was.elements.findIndex(e => e.visible);

    if (check.hidden === false && !check.expect) {
      if (check.match === 'all') {
        const gone = was.elements.filter(
          (e, i) => e.visible && !now.elements[i]?.visible
        ).length;
        return verdict(!gone, `${gone} no longer visible`);
      }
      return verdict(
        first !== -1 && now.elements[first].visible,
        'no longer visible'
      );
    }

    if (check.within) {
      const shownNow = now.elements.filter(e => e.visible);
      const outside = shownNow.filter(e => !e.inside).length;
      const overlapping = shownNow.filter(e => e.overlaps.length);
      const problems = [
        outside
          ? `${outside} of ${shownNow.length} outside ${check.within}`
          : '',
        overlapping.length
          ? `${overlapping.length} overlap ${[
              ...new Set(overlapping.flatMap(e => e.overlaps)),
            ].join(', ')}`
          : '',
      ].filter(Boolean);
      return verdict(
        shownNow.length > 0 && !problems.length,
        problems.join('; ') || 'nothing visible'
      );
    }

    if (check.columns) {
      return verdict(
        now.columns === check.columns,
        `${now.columns ?? 0} columns`
      );
    }

    const match = check.match ?? 'first';
    const shown = now.elements
      .map((e, i) => (e.visible ? i : -1))
      .filter(i => i !== -1);
    const firstOnly = first === -1 ? [] : [first];
    const indexes = match === 'first' ? firstOnly : shown;

    if (!indexes.length) {
      return verdict(false, `nothing visible matches ${check.selector}`);
    }

    const failures = indexes.map(i => {
      const element = now.elements[i];
      if (!element.visible) {
        return 'no longer visible';
      }
      const misses = Object.entries(check.expect).filter(
        ([prop, expected]) =>
          !meets(expected, element.values[prop], was.elements[i]?.values[prop])
      );
      return misses.length
        ? misses
            .map(
              ([prop]) =>
                `${prop} ${show(element.values[prop])}${
                  was.elements[i]?.visible
                    ? ` (was ${show(was.elements[i].values[prop])})`
                    : ''
                }`
            )
            .join(', ')
        : null;
    });

    const pass =
      match === 'any' ? failures.some(f => !f) : failures.every(f => !f);
    return verdict(pass, failures.find(Boolean));
  });
