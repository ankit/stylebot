import { getStyleOptionValue, parseStyleOptions } from '@stylebot/css';
import { expandProfiles, getProfileOptions } from '@stylebot/saved-styles';
import type {
  StyleOptionName,
  StyleWithoutUrl,
  SupportedStyleOptions,
} from '@stylebot/types';

import { applyStylesToAllTabs, getAll, setStyleOption } from '../styles';
import { EMPTY_STYLE, resolveProfileId } from './profiles';
import { requireNamed, resolveStyleUrl } from './targets';
import type { CliCommands } from './types';

/**
 * The profile a command names, or the one in use, with its declared options
 * and the value each is set to.
 */
const describeOptions = (
  style: StyleWithoutUrl | undefined,
  profile: unknown
) => {
  const { active, sheets } = expandProfiles(style ?? EMPTY_STYLE);
  const id = profile ? resolveProfileId(style, profile) : active;
  const declared = parseStyleOptions(sheets[id]?.css ?? '');
  const stored = getProfileOptions(style, id);

  const options = Object.entries(declared).map(([name, declaration]) => ({
    name,
    values: declaration.values,
    default: declaration.default,
    value: getStyleOptionValue(declaration, stored[name]),
  }));

  return { id, options };
};

export const optionCommands: CliCommands = {
  async options({ target, profile }) {
    const url = await resolveStyleUrl(target);
    const { id, options } = describeOptions((await getAll())[url], profile);

    return { url, profileId: id, options };
  },

  async setOption({ target, profile, option, value }) {
    requireNamed(target, 'site or tab');
    const url = await resolveStyleUrl(target);
    const { id, options } = describeOptions((await getAll())[url], profile);
    const declared = options.find(({ name }) => name === option);

    if (!declared) {
      throw new Error(`The profile doesn't declare a ${option} option`);
    }

    if (!declared.values.includes(String(value))) {
      throw new Error(
        `${option} takes one of ${declared.values.join(', ')}, not ${value}`
      );
    }

    const name = option as StyleOptionName;

    await setStyleOption(
      url,
      id,
      name,
      value as SupportedStyleOptions[typeof name]
    );
    await applyStylesToAllTabs();

    return { url, profileId: id, option: name, value };
  },
};
