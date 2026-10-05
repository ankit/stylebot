import { hasStatePseudo, withoutStatePseudos } from './state-pseudos';

describe('withoutStatePseudos', () => {
  it('drops states and pseudo-elements from each selector in a list', () => {
    expect(withoutStatePseudos('a:hover, input::placeholder')).toBe('a, input');
  });

  it('keeps a selector valid when a state was all of a compound', () => {
    expect(withoutStatePseudos('nav :focus-visible')).toBe('nav *');
  });

  it('leaves structural pseudo-classes alone', () => {
    expect(withoutStatePseudos('li:first-child a:not(.x)')).toBe(
      'li:first-child a:not(.x)'
    );
  });
});

describe('hasStatePseudo', () => {
  it('tells states and pseudo-elements from structural pseudo-classes', () => {
    expect(hasStatePseudo('button:hover')).toBe(true);
    expect(hasStatePseudo('p::after')).toBe(true);
    expect(hasStatePseudo('li:first-child')).toBe(false);
  });
});
