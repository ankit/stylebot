import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Outside the repo, so the project's CLAUDE.md doesn't reach the model.
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-eval-'));

/**
 * Asks headless Claude Code for a reply matching the JSON schema, billed to
 * the signed-in subscription rather than an API key. Resolves to the
 * structured output with the call's usage and duration.
 */
export const askClaude = ({
  model,
  system,
  prompt,
  schema,
  readDir,
  thinking = true,
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
      'json',
      '--json-schema',
      JSON.stringify(schema),
      ...(readDir
        ? ['--tools', 'Read', '--allowedTools', 'Read', '--add-dir', readDir]
        : ['--tools', '']),
    ];

    const child = spawn('claude', args, {
      cwd: WORK_DIR,
      env: thinking
        ? process.env
        : { ...process.env, MAX_THINKING_TOKENS: '0' },
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('error', reject);
    child.on('close', code => {
      fs.rmSync(systemFile, { force: true });

      let result;

      try {
        result = JSON.parse(stdout);
      } catch {
        reject(new Error(`claude exited ${code}: ${stderr || stdout}`));
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
        },
        ms: result.duration_ms ?? 0,
      });
    });

    child.stdin.end(prompt);
  });
