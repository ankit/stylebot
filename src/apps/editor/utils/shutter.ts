const TICK_MS = 12;

/**
 * Plays a soft tick as a screenshot is taken: a few milliseconds of
 * high-passed noise, so there's no audio file to ship.
 */
export const playShutterSound = (): void => {
  try {
    const context = new AudioContext();
    const length = Math.round((context.sampleRate * TICK_MS) / 1000);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 4;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    gain.gain.value = 0.35;

    source.connect(filter).connect(gain).connect(context.destination);
    source.start();

    setTimeout(() => context.close(), 200);
  } catch {
    // Audio is a nicety; a page or browser that blocks it just stays silent.
  }
};

/**
 * Flashes the page white for a moment, like a camera flash.
 */
export const flashPage = (): void => {
  const flash = document.createElement('div');

  flash.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;background:#fff;pointer-events:none;opacity:0';
  document.documentElement.appendChild(flash);

  flash
    .animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.2 }, { opacity: 0 }], {
      duration: 320,
      easing: 'ease-out',
    })
    .finished.finally(() => flash.remove());
};
