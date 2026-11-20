import { splitAround } from './split-around';

describe('splitAround', () => {
  it('sets the part apart wherever it falls, dropping empty pieces', () => {
    expect(splitAround('Force !important', '!important')).toEqual([
      { text: 'Force ', match: false },
      { text: '!important', match: true },
    ]);
    expect(splitAround('!important を強制', '!important')).toEqual([
      { text: '!important', match: true },
      { text: ' を強制', match: false },
    ]);
  });

  it('leaves text without the part whole', () => {
    expect(splitAround('Styled by', 'h1')).toEqual([
      { text: 'Styled by', match: false },
    ]);
  });
});
