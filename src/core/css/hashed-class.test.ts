import {
  getStableClassParts,
  looksGeneratedId,
  looksHashed,
  looksMinified,
} from './hashed-class';

describe('hashed-class', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getStableClassParts', () => {
    it.each([
      ['Header_nav__a1B2c', ['Header_nav__']],
      ['Button_root___x7Yz', ['Button_root__']],
      ['styles_root__1hiof570', ['styles_root__']],
      ['Header__Nav-sc-1x2y3z-0', ['Header__Nav-sc-']],
      [
        'PullRequestBranchName-module__branchName__SCtl2',
        ['PullRequestBranchName-module__branchName__'],
      ],
      ['NavDropdown-module__button__PEHWX', ['NavDropdown-module__button__']],
      ['NavGroup-module__list__UCOFy', ['NavGroup-module__list__']],
      [
        'MarketingHeader-module__topRow__yeury',
        ['MarketingHeader-module__topRow__'],
      ],
      [
        'Primer_Brand__Button-module__Button--label___qrkyz',
        ['Primer_Brand__Button-module__Button--label___'],
      ],
      ['prc-TopicTag-TopicTag-LS-jX', ['prc-TopicTag-TopicTag-']],
      ['prc-Button-ButtonBase-c50BI', ['prc-Button-ButtonBase-']],
      ['prc-Link-Link-85e08', ['prc-Link-Link-']],
      ['page-module__E0kJGG__main', ['page-module__', '__main']],
      ['page-module__E0kJGG__title', ['page-module__', '__title']],
      ['Text-module__text2xl__Ab3Cd', ['Text-module__text2xl__']],
      [
        'DirectoryContent-module__Box_1__fuSBO',
        ['DirectoryContent-module__Box_1__'],
      ],
      ['page-module__E0kJGG__navItem', ['page-module__', '__navItem']],
      ['_card_1wfme_1', ['_card_']],
      ['caa-button-label-_R_93adeslcldcpbn6b5ipam_', ['caa-button-label-']],
      ['ZcdlOG_nav', ['_nav']],
      ['Wr7_RG_mastheadContainer', ['_mastheadContainer']],
      ['jXhsNG_dividerLeft', ['_dividerLeft']],
      ['_5zuA3W_topDivider', ['_topDivider']],
      ['w7VYaa_topBorder', ['_topBorder']],
    ])('keeps the authored parts of %s', (className, expected) => {
      expect(getStableClassParts(className)).toEqual(expected);
    });

    it.each([
      'card__title',
      'card__item2',
      'card__Item2',
      'menu__subMenu',
      'primary-nav',
      'col-md-12',
      'MuiGrid-grid-xs-12',
      'MuiButton-sizeLarge',
      'Card-Title-Large',
      'bg-red-500',
      '__a1B2c',
      'navBar_item',
      'Header_nav',
      'button_primary',
      'IconButton_label',
    ])('finds no hash in %s', className => {
      expect(getStableClassParts(className)).toBeNull();
    });
  });

  describe('looksHashed', () => {
    it.each([
      'WwrzSb',
      'a1b2c3',
      'm5k28',
      'vr1PYe',
      'tvs3Id',
      'r-1awozwy',
      'css-175oi2r',
      'css-1q2w3e-MuiButton-root',
      '_9dls',
      '_a6hd',
      '_7uluu50',
      '_1e7jslxu',
      '_971sicl',
      'gb_Ra',
      'gb_3d',
      'svelte-1abc2de',
      'astro-J7PV25F6',
      '__className_a64ecd',
      '__variable_a64ecd',
      'jss123',
      'makeStyles-root-12',
      'ng-tns-c3784233582-0',
      'Header_nav__a1B2c',
    ])('treats %s as generated', className => {
      expect(looksHashed(className)).toBe(true);
    });

    it.each([
      'primaryButton',
      'icon24px',
      'grid3x3',
      'v2Header',
      'col2md',
      'h1title',
      'item12',
      'Item2',
      'col2',
      'grid12',
      'h264',
      'card__title',
      'col-md-12',
      'r-auto',
      'xlarge',
      'xbox360',
      'x-large',
      'svelte-app',
      'css-truncate',
      '_main',
    ])('treats %s as authored', className => {
      expect(looksHashed(className)).toBe(false);
    });

    it('treats x-prefixed atomic classes as generated on a StyleX page', () => {
      const atomic = [
        'xeuugli',
        'xryxfnj',
        'xuoj239',
        'x1n2onr6',
        'xh8yej3',
        'x78zum5',
        'xdt5ytf',
        'x9f619',
        'xjbqb8w',
        'x1lliihq',
      ];
      document.body.innerHTML = `<div class="${atomic.join(' ')}"></div>`;

      expect(looksHashed('xeuugli')).toBe(true);
      expect(looksHashed('xlarge')).toBe(true);
    });

    it('keeps an x-prefixed word authored on other pages', () => {
      document.body.innerHTML = '<div class="xlarge xsmall x1n2onr6"></div>';

      expect(looksHashed('xlarge')).toBe(false);
    });
  });

  describe('looksMinified', () => {
    it.each(['LC20lb', 'VwiC3b', 'MjjYud', 'm5k28'])(
      'treats %s as minified',
      className => {
        expect(looksMinified(className)).toBe(true);
      }
    );

    it.each(['_1a2b3c', 'css-1q2w3e', 'gb_Ra', 'navItem', 'header'])(
      'does not treat %s as minified',
      className => {
        expect(looksMinified(className)).toBe(false);
      }
    );
  });

  describe('looksGeneratedId', () => {
    it.each([
      '_3MTJavGCHNyKptQPt7ejqQI_120',
      'tsuid_hsLJaqLJBPu9ruEP7uOYkAo_91',
      'atritem-_EIrBapXtL_6gw8cPyM7v4As_64',
    ])('treats %s as generated', id => {
      expect(looksGeneratedId(id)).toBe(true);
    });

    it.each([
      'rso',
      'main-content',
      'mainContentWrapperSection',
      'section2Title',
      'post-12345',
      'ti6dpd',
    ])('does not treat %s as generated', id => {
      expect(looksGeneratedId(id)).toBe(false);
    });
  });
});
