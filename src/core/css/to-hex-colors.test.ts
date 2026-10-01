import { toHexColors } from './to-hex-colors';

describe('toHexColors', () => {
  it.each([
    ['rgb(255, 121, 198)', '#ff79c6'],
    ['rgba(0, 0, 0, 0.5)', '#00000080'],
    ['rgb(0 0 0 / 1)', '#000000'],
    ['1px solid rgb(68, 71, 90)', '1px solid #44475a'],
    ['Verdana', 'Verdana'],
  ])('%s', (value, expected) => {
    expect(toHexColors(value)).toBe(expected);
  });
});
