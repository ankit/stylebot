const placeholderNames = message => [
  ...new Set([...message.matchAll(/\$([^$]+)\$/g)].map(m => m[1])),
];

// Shared by the webpack build and validate-locales.mjs; duplicateKeys exists
// because a repeated `@key` below silently overwrites the earlier entry.
// Placeholders are numbered by their order in `reference` (the English
// messages), so a translation can reorder them and still get the right value.
function parseLocaleConfig(raw, reference = {}) {
  const content = raw.replace(/^#.*?$/gm, '');
  const messages = {};
  const seenCounts = {};
  const regex = /@([a-z0-9_]+)/gi;

  let match;

  while ((match = regex.exec(content))) {
    const messageName = match[1];
    const messageStart = match.index + match[0].length;

    let messageEnd = content.indexOf('@', messageStart);

    if (messageEnd < 0) {
      messageEnd = content.length;
    }

    const message = content.substring(messageStart, messageEnd).trim();

    seenCounts[messageName] = (seenCounts[messageName] || 0) + 1;

    messages[messageName] = {
      message,
    };

    const names = placeholderNames(message);

    if (names.length > 0) {
      const order = reference[messageName]
        ? placeholderNames(reference[messageName].message)
        : names;

      messages[messageName].placeholders = {};

      names.forEach((name, index) => {
        const position = order.includes(name) ? order.indexOf(name) : index;

        messages[messageName].placeholders[name] = {
          content: `$${position + 1}`,
        };
      });
    }
  }

  const duplicateKeys = Object.keys(seenCounts).filter(
    key => seenCounts[key] > 1
  );

  return { messages, duplicateKeys };
}

module.exports = { parseLocaleConfig };
