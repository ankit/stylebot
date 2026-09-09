import { onEnterOrSpace } from './utils';

const keydown = (key: string): KeyboardEvent =>
  new KeyboardEvent('keydown', { key });

describe('onEnterOrSpace', () => {
  it('should call the handler and prevent default on Enter', () => {
    const event = keydown('Enter');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('should call the handler and prevent default on Space', () => {
    const event = keydown(' ');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('should ignore other keys', () => {
    const event = keydown('Tab');
    const preventDefault = jest.spyOn(event, 'preventDefault');
    const handler = jest.fn();

    onEnterOrSpace(event, handler);

    expect(handler).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
