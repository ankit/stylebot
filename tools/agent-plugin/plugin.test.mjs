const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = path.join(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

describe('stylebot skill', () => {
  it('has front matter that parses as strict YAML', () => {
    const [, frontMatter] = read(
      'tools/agent-plugin/skills/stylebot/SKILL.md'
    ).match(/^---\n([\s\S]*?)\n---\n/);
    const fields = yaml.safeLoad(frontMatter);

    expect(fields.name).toBe('stylebot');
    expect(typeof fields.description).toBe('string');
    expect(typeof fields['argument-hint']).toBe('string');
    expect(typeof fields['allowed-tools']).toBe('string');
  });
});

describe('stylebot plugin manifests', () => {
  it.each([
    '.claude-plugin/marketplace.json',
    'tools/agent-plugin/.claude-plugin/plugin.json',
  ])('%s parses as JSON', file => {
    expect(() => JSON.parse(read(file))).not.toThrow();
  });
});
