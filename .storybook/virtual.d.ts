declare module 'virtual:stylebot-locale' {
  const messages: Record<
    string,
    { message: string; placeholders?: Record<string, { content: string }> }
  >;
  export default messages;
}

declare module '../scripts/lib/parse-locale-config' {
  export function parseLocaleConfig(raw: string): {
    messages: Record<
      string,
      { message: string; placeholders?: Record<string, { content: string }> }
    >;
    duplicateKeys: Array<string>;
  };
}
