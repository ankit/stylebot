import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TOOLS = 'Bash,Read,Write,Edit,Skill';
// Where the skill keeps its files, which the eval moves into each task's folder.
const SKILL_WORK_DIR = '~/.stylebot/work';
const TIMEOUT_MS = 20 * 60 * 1000;

/**
 * Copies the checkout's Claude Code plugin with the skill's work folder
 * moved into the task's, so tasks running at once on the same site don't
 * share files and nothing lands in your ~/.stylebot. Returns the copy and
 * the tools the skill allows, as headless Claude Code is given them.
 */
export const preparePlugin = (plugin, dir) => {
  const copy = path.join(dir, 'plugin');
  const work = path.join(dir, 'work');
  fs.cpSync(plugin, copy, { recursive: true });
  fs.mkdirSync(work, { recursive: true });

  const skill = path.join(copy, 'skills', 'stylebot', 'SKILL.md');
  // Permission rules write an absolute path with a leading //.
  const text = fs
    .readFileSync(skill, 'utf8')
    .replace(/^allowed-tools:.*$/m, line =>
      line.replaceAll(SKILL_WORK_DIR, `/${work}`)
    )
    .replaceAll(SKILL_WORK_DIR, work);
  fs.writeFileSync(skill, text);

  // allowed-tools is space-separated, with spaces inside a rule's parentheses.
  const allowed =
    text
      .match(/^allowed-tools:\s*(.+)$/m)?.[1]
      .match(/[A-Za-z]+(\([^)]*\))?/g) ?? [];

  return { plugin: copy, work, allowedTools: allowed };
};

/**
 * Runs one turn of headless Claude Code in cwd, outside the repo so its
 * CLAUDE.md doesn't reach the model: the plugin loaded, `stylebot` on PATH
 * from bin, only the tools the skill allows approved, and no user settings,
 * plugins or MCP servers. Continues session when given one. Resolves to the
 * result message, with every stream-json line appended to transcript.
 */
export const runAgent = ({
  prompt,
  cwd,
  bin,
  plugin,
  allowedTools,
  model,
  effort,
  session,
  persist,
  transcript,
}) =>
  new Promise((resolve, reject) => {
    const args = [
      '-p',
      prompt,
      '--model',
      model,
      ...(effort ? ['--effort', effort] : []),
      '--plugin-dir',
      plugin,
      '--setting-sources',
      '',
      '--strict-mcp-config',
      '--tools',
      TOOLS,
      ...(allowedTools.length ? ['--allowedTools', ...allowedTools] : []),
      ...(session ? ['--resume', session] : []),
      ...(persist ? [] : ['--no-session-persistence']),
      '--output-format',
      'stream-json',
      '--verbose',
    ];

    const child = spawn('claude', args, {
      cwd,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => child.kill(), TIMEOUT_MS);
    const out = fs.createWriteStream(transcript, { flags: 'a' });
    let result = null;
    let stderr = '';
    let pending = '';

    const read = line => {
      if (!line) {
        return;
      }
      out.write(`${line}\n`);
      try {
        const message = JSON.parse(line);
        if (message.type === 'result') {
          result = message;
        }
      } catch {
        // A line that isn't JSON is Claude Code's own logging.
      }
    };

    child.stdout.on('data', chunk => {
      pending += chunk;
      const lines = pending.split('\n');
      pending = lines.pop();
      lines.forEach(read);
    });
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('error', reject);
    child.on('close', code => {
      clearTimeout(timer);
      read(pending);
      out.end();

      if (!result) {
        reject(
          new Error(
            `claude exited ${code} without a result: ${stderr.slice(-500)}`
          )
        );
        return;
      }
      resolve(result);
    });
  });

/**
 * The Bash commands and tool calls the agent made, from a transcript.
 */
export const toolCallsIn = transcript =>
  fs
    .readFileSync(transcript, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap(line => {
      try {
        const message = JSON.parse(line);
        return message.type === 'assistant'
          ? message.message.content.filter(block => block.type === 'tool_use')
          : [];
      } catch {
        return [];
      }
    });
