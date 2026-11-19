import { t } from '@stylebot/i18n';
import { codeThemes } from '@stylebot/settings';
import type { StylebotCodeTheme } from '@stylebot/types';

const PALETTE_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21a9 9 0 0 1 0-18c4.97 0 9 3.58 9 8 0 1.06-.47 2.08-1.32 2.83-.84.75-1.99 1.17-3.18 1.17h-2.5a2 2 0 0 0-1 3.75 1.3 1.3 0 0 1-1 2.25"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></svg>`;

const CHECK_ICON = `<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.3 4.8 8.6 9.5 3.6"/></svg>`;

export type CodeThemeMenuOptions = {
  codeTheme: () => StylebotCodeTheme;
  previewCodeTheme: (codeTheme: StylebotCodeTheme) => void;
  pickCodeTheme: (codeTheme: StylebotCodeTheme) => void;
  cancel: () => void;
};

export type CodeThemeMenu = {
  open: () => void;
  // Shows the code theme in use on the footer's button.
  refresh: () => void;
};

const element = (
  tag: string,
  className: string,
  attributes: Record<string, string> = {}
): HTMLElement => {
  const node = document.createElement(tag);

  node.className = className;
  Object.entries(attributes).forEach(([name, value]) =>
    node.setAttribute(name, value)
  );

  return node;
};

const nameOf = (codeTheme: StylebotCodeTheme): string =>
  codeThemes.find(({ value }) => value === codeTheme)?.name ?? '';

/**
 * The strip under the code editor, whose button names the code theme in
 * use and opens the list of themes. Arrowing through the list previews each
 * theme; Enter or a click keeps it, and Escape or a click elsewhere puts the
 * old one back.
 */
export const createCodeThemeMenu = (
  options: CodeThemeMenuOptions
): CodeThemeMenu => {
  // Monaco puts each theme's colours on .monaco-component as variables.
  const footer = element('div', 'code-editor-footer monaco-component');

  const button = element('button', 'code-theme-button', {
    type: 'button',
    title: t('code_theme'),
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
    'aria-controls': 'code-theme-list',
  });
  const buttonLabel = document.createElement('span');
  button.innerHTML = PALETTE_ICON;
  button.append(buttonLabel);
  footer.append(button);

  const list = element('div', 'code-theme-list', {
    id: 'code-theme-list',
    role: 'listbox',
    tabindex: '-1',
    'aria-label': t('code_theme'),
  });
  list.hidden = true;

  const items = codeThemes.map(({ value, name }) => {
    const item = element('div', 'code-theme-option', {
      id: `code-theme-${value}`,
      role: 'option',
    });
    const label = document.createElement('span');

    label.textContent = name;
    item.append(label);
    item.insertAdjacentHTML('beforeend', CHECK_ICON);
    list.append(item);

    return item;
  });

  let isOpen = false;
  let active = 0;

  const refresh = () => {
    const name = nameOf(options.codeTheme());

    buttonLabel.textContent = name;
    button.setAttribute('aria-label', `${t('code_theme')}: ${name}`);
  };

  const setActive = (index: number, preview: boolean) => {
    active = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle('active', i === active));
    list.setAttribute('aria-activedescendant', items[active].id);

    if (preview) {
      options.previewCodeTheme(codeThemes[active].value);
    }
  };

  const close = () => {
    isOpen = false;
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', onDocumentMousedown, true);
  };

  const cancel = () => {
    close();
    options.cancel();
  };

  const pick = (index: number) => {
    close();
    options.pickCodeTheme(codeThemes[index].value);
  };

  const open = () => {
    const current = options.codeTheme();

    isOpen = true;
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    items.forEach((item, i) =>
      item.setAttribute(
        'aria-selected',
        String(codeThemes[i].value === current)
      )
    );
    setActive(
      codeThemes.findIndex(({ value }) => value === current),
      false
    );
    list.focus();
    document.addEventListener('mousedown', onDocumentMousedown, true);
  };

  function onDocumentMousedown(event: MouseEvent): void {
    const target = event.target as Node;

    if (!list.contains(target) && !button.contains(target)) {
      cancel();
    }
  }

  button.addEventListener('click', () => (isOpen ? cancel() : open()));

  items.forEach((item, index) => {
    item.addEventListener('mousemove', () => {
      if (active !== index) {
        setActive(index, false);
      }
    });
    item.addEventListener('click', () => pick(index));
  });

  list.addEventListener('keydown', event => {
    const moves: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      Home: 0,
      End: items.length - 1,
    };

    if (event.key in moves) {
      setActive(moves[event.key], true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      pick(active);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      cancel();
    } else {
      return;
    }

    // Keeps Escape from also reaching the iframe's own handler, which
    // would leave Code mode.
    event.preventDefault();
    event.stopPropagation();
  });

  refresh();
  document.body.append(footer, list);

  return { open, refresh };
};
