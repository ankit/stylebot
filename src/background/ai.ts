import { get as getOption } from './options';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-opus-4-8';
const ANTHROPIC_VERSION = '2023-06-01';

const SYSTEM_PROMPT = `You are a CSS generation assistant embedded in the Stylebot browser extension. The user is looking at a specific webpage and describes, in plain language, a visual change they want to make to it.

You will be given the page's URL and the CSS already applied to the page (if any). Respond with the complete, updated CSS stylesheet that should apply to the page after the change: keep existing rules that are still wanted, modify or remove ones the request supersedes, and add whatever new rules implement the request.

Rules:
- Output ONLY valid CSS. No explanations, no markdown code fences, no text before or after the CSS.
- Use real, specific selectors that plausibly target elements on the page described.
- Prefer normal specificity; use !important only when needed to override the site's own styles.
- If the request is unrelated to visual styling or cannot reasonably be expressed as CSS, output only a CSS comment explaining why (e.g. "/* This request can't be expressed as CSS. */").`;

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

const stripCodeFence = (text: string): string => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:css)?\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1].trim() : trimmed;
};

export const generateCss = async ({
  prompt,
  css,
  url,
}: {
  prompt: string;
  css: string;
  url: string;
}): Promise<string> => {
  const apiKey = (await getOption('claudeApiKey')) as string;

  if (!apiKey) {
    throw new ClaudeApiError(0, 'missing_api_key', 'No Claude API key set.');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: new Headers({
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    }),
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Page: ${url}\n\nCurrent CSS applied to this page:\n${
            css || '/* none */'
          }\n\nRequest: ${prompt}`,
        },
      ],
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

  const text = (body.content || [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new ClaudeApiError(response.status, 'empty_response', 'Claude returned no CSS.');
  }

  return stripCodeFence(text);
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
