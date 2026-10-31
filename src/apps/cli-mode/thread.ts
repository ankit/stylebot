import { t } from '@stylebot/i18n';
import type { CliThreadEntry, CliTurn, CliTurnStep } from '@stylebot/types';

type Save = Extract<CliTurnStep, { kind: 'save' }>;

/**
 * A turn's one line: how many commands it ran, and how many times it saved.
 */
export const summarizeTurn = ({ steps }: CliTurn): string => {
  const commands = steps.filter(step => step.kind === 'command').length;
  const saves = steps.length - commands;
  const ran = t(commands === 1 ? 'ran_count_one' : 'ran_count_other', [
    String(commands),
  ]);

  if (!saves) {
    return ran;
  }

  const saved = t(saves === 1 ? 'saved_count_one' : 'saved_count_other', [
    String(saves),
  ]);

  return `${ran} · ${saved}`;
};

/**
 * The last save in some steps that can still be undone.
 */
export const lastUndoableSave = (steps: Array<CliTurnStep>): Save | undefined =>
  steps
    .filter((step): step is Save => step.kind === 'save' && !step.undone)
    .pop();

/**
 * Every step of every turn in a thread, in order.
 */
export const threadSteps = (
  thread: Array<CliThreadEntry>
): Array<CliTurnStep> =>
  thread.flatMap(entry => (entry.kind === 'turn' ? entry.steps : []));
