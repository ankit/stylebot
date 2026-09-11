import { ClaudeConversationTurn, ClaudeModel } from '@stylebot/types';
import { get as getOption } from './options';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// $ per 1M tokens. Keep in sync with the models offered in TheChatEditor.vue.
const MODEL_PRICING: Record<ClaudeModel, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-opus-4-8': { input: 5, output: 25 },
};

// Adaptive thinking is only supported on Sonnet 5 / Opus 4.6+ — sending it to
// Haiku 4.5 errors, so it's included per-model rather than unconditionally.
const SUPPORTS_ADAPTIVE_THINKING: Record<ClaudeModel, boolean> = {
  'claude-haiku-4-5': false,
  'claude-sonnet-5': true,
  'claude-opus-4-8': true,
};

const calculateCost = (
  model: ClaudeModel,
  usage: { input_tokens?: number; output_tokens?: number }
): number => {
  const pricing = MODEL_PRICING[model];
  return (
    ((usage.input_tokens || 0) / 1_000_000) * pricing.input +
    ((usage.output_tokens || 0) / 1_000_000) * pricing.output
  );
};

const SYSTEM_PROMPT = `You are a CSS generation assistant embedded in the Stylebot browser extension, chatting with a user who is looking at a specific webpage and describes, in plain language, visual changes they want to make to it. The conversation may span multiple turns as the user refines their request.

Each user turn includes the page's URL, the CSS already applied to the page (if any), and the request. A pruned outline of the page's DOM is included only when it has changed since it was last sent in this conversation — if it's omitted, reuse the DOM outline from earlier in the conversation; the page structure is unchanged.

The DOM outline is indented one line per element, showing only tag name, id, class, and role/aria attributes (all other attributes, text content beyond a short snippet, and script/style tags are stripped). Repeated sibling elements or groups of elements (e.g. rows in a list) are shown once or twice and then summarized as "N more ... siblings (same shape)" — treat that summary as N additional elements with the same tag/class structure, not literal text to reference.

Respond with two things: a short, friendly chat reply for the user (a sentence or two — summarize what you changed, or explain why you couldn't, as if replying directly to them), and the complete, updated CSS stylesheet that should apply to the page after the change. When updating CSS from a prior turn, keep existing rules that are still wanted, modify or remove ones the request supersedes, and add whatever new rules implement the request.

Rules:
- The CSS you return must be nothing but valid CSS — no markdown code fences, no comments explaining your reasoning.
- Use the DOM outline to write selectors that target real elements on the page — prefer ids and classes that appear in the outline over guessing.
- If the request contains a CSS selector wrapped in backticks (e.g. \`.foo\`), the user clicked that exact element on the page to point you at it — use that selector directly rather than inferring a different one, even if the DOM outline collapsed it into a "more siblings" summary.
- Prefer normal specificity; use !important only when needed to override the site's own styles.
- If the request is unrelated to visual styling or cannot reasonably be expressed as CSS, explain why in your chat reply and return the CSS unchanged from the current stylesheet.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      description:
        "A short, friendly chat reply to show the user directly — summarize what changed, or explain why the request couldn't be applied. Not a commit message; write it as a reply to them.",
    },
    css: {
      type: 'string',
      description: 'The complete, updated CSS stylesheet for the page.',
    },
  },
  required: ['message', 'css'],
  additionalProperties: false,
};

class ClaudeApiError extends Error {
  status: number;
  type: string;

  constructor(status: number, type: string, message: string) {
    super(message);

    // TS compiles to a target where `class X extends Error` breaks the
    // prototype chain, so `instanceof ClaudeApiError` would otherwise
    // always be false — restore it explicitly.
    Object.setPrototypeOf(this, ClaudeApiError.prototype);

    this.status = status;
    this.type = type;
  }
}

const buildUserContent = ({
  prompt,
  css,
  url,
  dom,
}: {
  prompt: string;
  css: string;
  url: string;
  dom: string;
}): string => {
  const domSection = dom
    ? `DOM outline:\n${dom}`
    : 'DOM outline: unchanged from earlier in this conversation.';

  return `Page: ${url}\n\n${domSection}\n\nCurrent CSS applied to this page:\n${
    css || '/* none */'
  }\n\nRequest: ${prompt}`;
};

export const generateCss = async ({
  prompt,
  css,
  url,
  dom,
  history,
  model,
}: {
  prompt: string;
  css: string;
  url: string;
  dom: string;
  history: Array<ClaudeConversationTurn>;
  model: ClaudeModel;
}): Promise<{
  css: string;
  message: string;
  userContent: string;
  assistantContent: string;
  cost: number;
}> => {
  const apiKey = ((await getOption('claudeApiKey')) as string)?.trim();

  if (!apiKey) {
    throw new ClaudeApiError(0, 'missing_api_key', 'No Claude API key set.');
  }

  const userContent = buildUserContent({ prompt, css, url, dom });

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: new Headers({
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
      // The service worker's fetch is indistinguishable from a webpage's to
      // Anthropic's CORS check, so it's rejected unless we opt in. Safe here:
      // the key is the user's own, entered in their own options page, and
      // never leaves their machine except in this request.
      'anthropic-dangerous-direct-browser-access': 'true',
    }),
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      ...(SUPPORTS_ADAPTIVE_THINKING[model]
        ? { thinking: { type: 'adaptive' } }
        : {}),
      system: SYSTEM_PROMPT,
      output_config: {
        format: {
          type: 'json_schema',
          schema: RESPONSE_SCHEMA,
        },
      },
      messages: [...history, { role: 'user', content: userContent }],
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new ClaudeApiError(
      response.status,
      body?.error?.type || 'unknown_error',
      body?.error?.message || `Claude API request failed (${response.status})`
    );
  }

  if (body.stop_reason === 'refusal') {
    throw new ClaudeApiError(response.status, 'refusal', 'Claude declined this request.');
  }

  const assistantContent = (body.content || [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('\n')
    .trim();

  if (!assistantContent) {
    throw new ClaudeApiError(response.status, 'empty_response', 'Claude returned no response.');
  }

  let parsed: { message: string; css: string };
  try {
    parsed = JSON.parse(assistantContent);
  } catch (e) {
    throw new ClaudeApiError(
      response.status,
      'empty_response',
      'Claude returned a response that could not be parsed.'
    );
  }

  return {
    css: parsed.css,
    message: parsed.message,
    userContent,
    assistantContent,
    cost: calculateCost(model, body.usage || {}),
  };
};

export const getErrorCode = (e: unknown): string => {
  if (e instanceof ClaudeApiError) {
    if (e.type === 'missing_api_key') {
      return 'missing_api_key';
    }

    if (e.status === 401 || e.type === 'authentication_error') {
      return 'invalid_api_key';
    }

    if (e.status === 429 || e.type === 'rate_limit_error') {
      return 'rate_limited';
    }

    if (e.type === 'refusal') {
      return 'refusal';
    }
  }

  return 'unknown_error';
};
