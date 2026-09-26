export const TOOL_NAME = 'apply_css';

export const TOOL_DESCRIPTION =
  "Applies CSS changes to the page. Each edit sets properties on one selector; an empty value removes that property from Stylebot's stylesheet.";

export const TOOL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['edits'],
  properties: {
    edits: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['selector', 'declarations'],
        properties: {
          selector: { type: 'string' },
          declarations: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['property', 'value'],
              properties: {
                property: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

// What the model is told happened to its earlier apply_css calls, so it
// knows what the page looks like now.
export const TOOL_RESULT_APPLIED = 'Applied to the page.';
export const TOOL_RESULT_UNDONE = 'Applied, then undone by the user.';
