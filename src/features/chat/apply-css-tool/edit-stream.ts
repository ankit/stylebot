import type { ChatCssEdit } from '@stylebot/types';

import { parseEdit, readEditsList } from './parse-edits';

type Frame = {
  type: '{' | '[';
  // The key this object or array is the value of, in its parent object.
  key: string;
  // In an object, whether the next string is a key.
  expectKey: boolean;
  lastKey: string;
};

const WHITESPACE = new Set([' ', '\t', '\n', '\r']);

/**
 * Finds the entries of a top-level `edits` array in JSON that arrives in
 * pieces, reporting each entry's JSON text as soon as it's complete. It only
 * tracks strings and nesting, so a partial entry is never reported.
 */
export const createEditsExtractor = (onEntry: (json: string) => void) => {
  let json = '';
  const stack: Array<Frame> = [];
  let inString = false;
  let escaped = false;
  let stringStart = 0;
  let entryStart = -1;

  const inEdits = () =>
    stack.length === 2 &&
    stack[0].type === '{' &&
    stack[1].type === '[' &&
    stack[1].key === 'edits';

  const readKey = (end: number): string => {
    try {
      return JSON.parse(json.slice(stringStart, end + 1));
    } catch {
      return '';
    }
  };

  const emit = (end: number) => {
    onEntry(json.slice(entryStart, end).trim());
    entryStart = -1;
  };

  const step = (char: string, index: number) => {
    const top = stack[stack.length - 1];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;

        if (top?.type === '{' && top.expectKey) {
          top.lastKey = readKey(index);
          top.expectKey = false;
        }
      }
      return;
    }

    if (WHITESPACE.has(char)) {
      return;
    }

    if (inEdits() && entryStart === -1 && char !== ',' && char !== ']') {
      entryStart = index;
    }

    switch (char) {
      case '"':
        inString = true;
        stringStart = index;
        break;

      case '{':
      case '[':
        stack.push({
          type: char,
          key: top?.type === '{' ? top.lastKey : '',
          expectKey: char === '{',
          lastKey: '',
        });
        break;

      case '}':
      case ']':
        if (inEdits() && char === ']' && entryStart !== -1) {
          emit(index);
        }

        stack.pop();

        if (inEdits() && entryStart !== -1) {
          emit(index + 1);
        }
        break;

      case ',':
        if (inEdits() && entryStart !== -1) {
          emit(index);
        }

        if (top?.type === '{') {
          top.expectKey = true;
        }
        break;
    }
  };

  return {
    /**
     * Takes the next piece of the JSON.
     */
    write(chunk: string): void {
      const start = json.length;
      json += chunk;

      // Read from the chunk, so the growing json isn't copied to index it.
      for (let i = 0; i < chunk.length; i++) {
        step(chunk[i], start + i);
      }
    },

    /**
     * Everything written so far.
     */
    get json(): string {
      return json;
    },
  };
};

export type EditStream = ReturnType<typeof createEditStream>;

/**
 * Reads one apply_css call's input as it streams in, reporting each edit as
 * soon as its entry is complete. Once the call is whole, finish reports
 * any edit the streamed reading missed, so each is reported exactly once.
 */
export const createEditStream = (onEdit: (edit: ChatCssEdit) => void) => {
  // Entries read so far, valid or not, so finish knows where to pick up.
  let entries = 0;
  let count = 0;

  const report = (entry: unknown) => {
    const edit = parseEdit(entry);

    if (edit) {
      count++;
      onEdit(edit);
    }
  };

  const extractor = createEditsExtractor(json => {
    let entry: unknown;
    entries++;

    try {
      entry = JSON.parse(json);
    } catch {
      // Not valid JSON on its own; the whole call then won't parse either.
      return;
    }

    report(entry);
  });

  return {
    write(chunk: string): void {
      extractor.write(chunk);
    },

    get json(): string {
      return extractor.json;
    },

    /**
     * Reports the edits the streamed reading didn't, and returns how
     * many edits the call made in all; null when its JSON is broken.
     */
    finish(): number | null {
      const list = readEditsList(extractor.json);

      if (!list) {
        return null;
      }

      list.slice(entries).forEach(report);
      entries = list.length;
      return count;
    },
  };
};
