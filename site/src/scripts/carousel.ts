const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Width of one item plus the gap after it, i.e. the distance between the
 * starts of two neighbouring items.
 */
function itemStep(el: HTMLElement) {
  const item = el.firstElementChild;
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  return item ? item.getBoundingClientRect().width + gap : el.clientWidth;
}

/**
 * Scrolls a snap carousel to `to` with an ease-out animation. Snapping is
 * paused while animating so the browser doesn't fight the scroll.
 */
function animateTo(el: HTMLElement, to: number) {
  const from = el.scrollLeft;
  const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, to));
  if (target === from) {
    el.style.scrollSnapType = '';
    return;
  }
  if (reducedMotion()) {
    el.scrollLeft = target;
    el.style.scrollSnapType = '';
    return;
  }
  el.style.scrollSnapType = 'none';
  const t0 = performance.now();
  const duration = 380;
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - k, 3);
    el.scrollLeft = from + (target - from) * eased;
    if (k < 1) requestAnimationFrame(tick);
    else el.style.scrollSnapType = '';
  };
  requestAnimationFrame(tick);
}

function slide(el: HTMLElement, dir: number) {
  animateTo(el, el.scrollLeft + dir * itemStep(el));
}

/**
 * Lets a mouse drag the carousel like a touch swipe. On release it carries a
 * little momentum and settles on the nearest item. A drag suppresses the
 * click that would otherwise fire on the item under the pointer.
 */
function enableDrag(el: HTMLElement) {
  let startX = 0;
  let startScroll = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let dragging = false;
  let moved = false;

  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = lastX = e.clientX;
    startScroll = el.scrollLeft;
    lastT = performance.now();
    velocity = 0;
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < 5) return;
    if (!moved) {
      moved = true;
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = 'none';
      el.classList.add('is-dragging');
    }
    const now = performance.now();
    velocity = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX;
    lastT = now;
    el.scrollLeft = startScroll - dx;
  });

  const end = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (!moved) return;
    if (el.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId);
    el.classList.remove('is-dragging');
    const step = itemStep(el);
    const projected = el.scrollLeft - velocity * 200;
    animateTo(el, Math.round(projected / step) * step);
  };

  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  el.addEventListener(
    'click',
    (e) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    },
    true,
  );

  el.addEventListener('dragstart', (e) => e.preventDefault());
}

document.querySelectorAll<HTMLElement>('[data-carousel-nav]').forEach((nav) => {
  const track = document.getElementById(nav.dataset.carouselNav!);
  if (!track) return;
  enableDrag(track);
  if (!track.hasAttribute('tabindex')) track.tabIndex = 0;
  track.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    slide(track, e.key === 'ArrowRight' ? 1 : -1);
  });
  nav.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((btn) => {
    btn.addEventListener('click', () => slide(track, Number(btn.dataset.dir)));
  });
});
