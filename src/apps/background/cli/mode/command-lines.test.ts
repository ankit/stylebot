import { describeCommand } from './command-lines';

describe('describeCommand', () => {
  it('writes a command as the agent typed it, less the tab', () => {
    expect(describeCommand('outline', { tab: '7' })).toBe('outline');
    expect(describeCommand('pageRules', { tab: '7', selector: 'h1' })).toBe(
      'page-rules h1'
    );
    expect(
      describeCommand('screenshot', { tab: '7', selector: '.nav a', scale: 2 })
    ).toBe("screenshot --selector '.nav a'");
  });

  it('writes the rules a css rule edit sets and unsets', () => {
    expect(
      describeCommand('editRule', {
        target: '7',
        selector: 'h1',
        set: [{ property: 'color', value: 'red' }],
        unset: ['margin'],
        profile: 'Dark',
      })
    ).toBe('css rule h1 --set color=red --unset margin');
  });

  it("leaves out commands that don't act on a page", () => {
    expect(describeCommand('tabs', {})).toBeUndefined();
    expect(describeCommand('mode', { tab: '7' })).toBeUndefined();
  });
});
