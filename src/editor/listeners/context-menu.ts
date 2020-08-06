import { Commit } from 'vuex';
import { getSelector } from '@stylebot/css';

const initContextMenuListener = ({ commit }: { commit: Commit }): void => {
  document.addEventListener('contextmenu', event => {
    if (event.target) {
      const selector = getSelector(event.target as HTMLElement);
      commit('setContextMenuSelector', selector);
    }
  });
};

export default initContextMenuListener;
