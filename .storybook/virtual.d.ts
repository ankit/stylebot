declare module 'virtual:stylebot-locale' {
  const messages: Record<
    string,
    { message: string; placeholders?: Record<string, { content: string }> }
  >;
  export default messages;
}
