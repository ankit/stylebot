export type LocaleMessages = Record<
  string,
  { message: string; placeholders?: Record<string, { content: string }> }
>;

export function parseLocaleConfig(
  raw: string,
  reference?: LocaleMessages
): {
  messages: LocaleMessages;
  duplicateKeys: Array<string>;
};
