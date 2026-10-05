import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Outside the repo, so the project's CLAUDE.md doesn't reach the model.
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-eval-'));
const THINKING_BUDGET = '8000';

/**
 * Times the edits of a reply as its structured output streams in: when the
 * first and the last are complete, in ms since the call started, as a
 * version applying edits while they stream would apply them.
 */
const editTimer = (createEditStream, started) => {
  const times = { first: null, last: null };
  const streams = new Map();
  const note = () => {
    times.last = Date.now() - started;
    times.first ??= times.last;
  };

  return {
    times,
    // One line of Claude Code's stream-json output.
    read(line) {
      let message;

      try {
        message = JSON.parse(line);
      } catch {
        return;
      }

      const event = message.type === 'stream_event' ? message.event : null;

      if (event?.type === 'content_block_start') {
        if (event.content_block?.type === 'tool_use') {
          streams.set(event.index, createEditStream(note));
        }
      } else if (event?.delta?.type === 'input_json_delta') {
        streams.get(event.index)?.write(event.delta.partial_json ?? '');
      }
    },
  };
};

/**
 * Asks headless Claude Code for a reply matching the JSON schema, billed to
 * the signed-in subscription rather than an API key. thinking is 'on', 'off',
 * or undefined for Claude Code's default, and effort a level or undefined.
 * Resolves to the structured output with the model that answered, its usage
 * and duration, and when its first and last edits were complete.
 */
export const askClaude = ({
  model,
  system,
  prompt,
  schema,
  thinking,
  effort,
  createEditStream,
}) =>
  new Promise((resolve, reject) => {
    const systemFile = path.join(
      WORK_DIR,
      `system-${process.hrtime.bigint()}.txt`
    );
    fs.writeFileSync(systemFile, system);

    const args = [
      '-p',
      '--model',
      model,
      '--system-prompt-file',
      systemFile,
      '--setting-sources',
      '',
      '--no-session-persistence',
      '--output-format',
      'stream-json',
      '--verbose',
      '--include-partial-messages',
      '--json-schema',
      JSON.stringify(schema),
      '--tools',
      '',
      ...(effort ? ['--effort', effort] : []),
    ];

    const started = Date.now();
    const timer = createEditStream
      ? editTimer(createEditStream, started)
      : null;
    const child = spawn('claude', args, {
      cwd: WORK_DIR,
      env: thinking
        ? {
            ...process.env,
            MAX_THINKING_TOKENS: thinking === 'on' ? THINKING_BUDGET : '0',
          }
        : process.env,
    });
    // Only the last line is kept: stream-json ends on the result.
    let lastLine = '';
    let stderr = '';
    let pending = '';

    child.stdout.on('data', chunk => {
      pending += chunk;

      const lines = pending.split('\n');
      pending = lines.pop();
      lines.forEach(line => timer?.read(line));
      lastLine = [...lines, pending].filter(Boolean).pop() ?? lastLine;
    });
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('error', reject);
    child.on('close', code => {
      fs.rmSync(systemFile, { force: true });

      const wallMs = Date.now() - started;
      let result;

      try {
        // The last line of stream-json is the result.
        result = JSON.parse(lastLine);
      } catch {
        reject(new Error(`claude exited ${code}: ${stderr || lastLine}`));
        return;
      }

      if (result.is_error || !result.structured_output) {
        reject(new Error(`claude failed: ${result.result ?? stderr}`));
        return;
      }

      resolve({
        output: result.structured_output,
        usage: {
          input:
            (result.usage?.input_tokens ?? 0) +
            (result.usage?.cache_read_input_tokens ?? 0) +
            (result.usage?.cache_creation_input_tokens ?? 0),
          output: result.usage?.output_tokens ?? 0,
          thinking: result.usage?.output_tokens_details?.thinking_tokens ?? 0,
        },
        // The model that answered, without its date: claude-haiku-4-5.
        model: Object.keys(result.modelUsage ?? {})[0]?.replace(/-\d{8}$/, ''),
        ms: result.duration_ms ?? 0,
        wallMs,
        firstEditMs: timer?.times.first ?? null,
        lastEditMs: timer?.times.last ?? null,
      });
    });

    child.stdin.end(prompt);
  });
