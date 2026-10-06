import type { JSX } from 'preact';
import { ChevronUp } from '../icons';
import './chat.css';

type Bar = [width: number, color: string, height?: number];

export type Suggestion = [label: string, bg: string, art: JSX.Element];

const Bars = ({ bars, square }: { bars: Bar[]; square?: boolean }) => (
  <>
    {bars.map(([w, c, h = 2], i) => (
      <span
        key={i}
        class="chat-art-bar"
        style={`width:${w}%;height:${h}px;background:${c}${square ? ';border-radius:0' : ''}`}
      />
    ))}
  </>
);

const PAGE_BARS: Bar[] = [
  [100, '#9aa0aa'],
  [80, '#9aa0aa'],
  [90, '#9aa0aa'],
  [60, '#9aa0aa'],
];

const COLUMN_BARS = (head: Bar): Bar[] => [
  head,
  [80, '#9b9383'],
  [90, '#9b9383'],
  [60, '#9b9383'],
];

const READ_LIKE_A_BOOK: Suggestion = [
  'Read like a book',
  '#f2f3f6',
  <span style="display:flex;gap:2px">
    {[-4, 4].map((r) => (
      <span
        key={r}
        class="chat-art-page"
        style={`width:22px;height:32px;padding:0 4px;transform:rotate(${r}deg)`}
      >
        <Bars bars={PAGE_BARS} />
      </span>
    ))}
  </span>,
];

const DARK_MODE: Suggestion = [
  'Dark mode',
  '#1c1d20',
  <span style="width:24px;height:24px;border-radius:50%;box-shadow:inset -7px -3px 0 0 oklch(0.78 0.12 260);transform:rotate(-20deg)" />,
];

const PAPER_AND_INK: Suggestion = [
  'Paper & ink',
  '#e6dcc4',
  <span
    class="chat-art-page"
    style="width:30px;height:38px;padding:0 5px;border-radius:3px;background:#faf6ec;box-shadow:0 3px 6px rgba(60,40,20,.18);transform:rotate(-6deg)"
  >
    <Bars
      bars={[
        [100, '#2b2a27'],
        [80, '#2b2a27'],
        [60, '#8a6a4a'],
        [90, '#2b2a27'],
      ]}
    />
  </span>,
];

const WABI_SABI: Suggestion = [
  'Wabi-sabi',
  '#f6f3ec',
  <>
    <span style="width:22px;height:22px;border-radius:50%;box-sizing:border-box;border:3px solid #2b2a27;border-right-color:transparent;transform:rotate(-30deg)" />
    <span style="width:6px;height:6px;border-radius:50%;background:#d6452a" />
  </>,
];

export const MORNING_NEWSPAPER: Suggestion = [
  'Morning newspaper',
  '#f2ead8',
  <span style="display:flex;gap:5px;width:100%;padding:0 10px;box-sizing:border-box">
    {[
      COLUMN_BARS([100, '#161513', 4]),
      COLUMN_BARS([100, '#161513']),
      COLUMN_BARS([100, '#161513']),
    ].map((bars, i) => (
      <span
        key={i}
        class="chat-art-column"
        style={i ? 'padding-left:5px;border-left:1px solid #b9b09c' : ''}
      >
        <Bars bars={bars} square />
      </span>
    ))}
  </span>,
];

export const NIGHT_OWL: Suggestion = [
  'Night owl',
  '#1a1512',
  <span style="display:flex;flex-direction:column;gap:4px;width:56px">
    <Bars
      bars={[
        [70, '#e0a44a', 4],
        [100, '#d9cfbe'],
        [90, '#d9cfbe'],
        [60, '#a39886'],
      ]}
    />
  </span>,
];

const TERMINAL_IN_EVERFOREST: Suggestion = [
  'Terminal in Everforest',
  '#2d353b',
  <>
    <span style="font:600 15px/1 'Geist Mono',ui-monospace,monospace;color:#a7c080">
      &gt;_
    </span>
    <span style="display:flex;flex-direction:column;gap:4px;width:30px">
      <Bars
        bars={[
          [100, '#d3c6aa', 3],
          [70, '#e69875', 3],
        ]}
      />
    </span>
  </>,
];

export const FIRST_DECK: Suggestion[] = [
  READ_LIKE_A_BOOK,
  DARK_MODE,
  PAPER_AND_INK,
];

export const SECOND_DECK: Suggestion[] = [
  WABI_SABI,
  MORNING_NEWSPAPER,
  TERMINAL_IN_EVERFOREST,
];

type EmptyProps = {
  decks: Suggestion[][];
  hoverable?: boolean;
  moreStyle?: string;
  moreIconStyle?: string;
  cardStyle?: (deck: number, card: number) => string;
};

/**
 * Chat's empty state: a prompt, More ideas, and decks of suggestion cards
 * stacked in one cell, so a scripted demo can deal one deck over another.
 */
export function ChatEmpty({
  decks,
  hoverable,
  moreStyle,
  moreIconStyle,
  cardStyle,
}: EmptyProps) {
  return (
    <div class="chat-empty">
      <div class="chat-intro">
        <div class="chat-title">What should this site look like?</div>
        <div class="chat-sub">
          Each change is written to the Code tab and applied to this site right
          away.
        </div>
      </div>
      <div class="chat-ideas">
        <span data-t="more-ideas" class="chat-more" style={moreStyle}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={moreIconStyle}
            aria-hidden="true"
          >
            <path d="M2 4.5h2.5c3.5 0 4 7 7.5 7h2" />
            <path d="M2 11.5h2.5c1.2 0 2-.8 2.7-1.9M9.3 6.4c.7-1.1 1.5-1.9 2.7-1.9h2" />
            <path d="M12.5 2.8 14 4.5l-1.5 1.7M12.5 9.8 14 11.5l-1.5 1.7" />
          </svg>
          More ideas
        </span>
        <div class="chat-decks">
          {decks.map((deck, d) => (
            <div key={d} class="chat-deck">
              {deck.map(([label, bg, art], i) => (
                <div
                  key={label}
                  data-t={`card-${d}${i}`}
                  class={`chat-sug${hoverable ? ' is-hoverable' : ''}`}
                  style={cardStyle?.(d, i)}
                >
                  <span class="chat-art" style={`background:${bg}`}>
                    {art}
                  </span>
                  <span class="chat-sug-label">{label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type ComposerProps = {
  tokens?: string;
  thinking?: boolean;
  short?: boolean;
};

/**
 * Chat's message box with its toolbar: image attach, model, token count, and
 * a send button that turns into stop while a reply is coming in.
 */
export function ChatComposer({ tokens, thinking, short }: ComposerProps) {
  return (
    <div data-t="chat-input" class="chat-composer">
      <span class={`chat-placeholder${short ? ' is-short' : ''}`}>
        Describe a change…
      </span>
      <div class="chat-tools">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="3" width="12" height="10" rx="2" />
          <circle cx="5.8" cy="6.6" r="1.1" />
          <path d="m3 12 3.6-3.4 2.4 2.2 1.8-1.6L14 12" />
        </svg>
        <span class="chat-model">
          Sonnet 5.5
          <ChevronUp />
        </span>
        <span class="chat-tokens">{tokens}</span>
        <span class={`chat-send${thinking ? ' is-busy' : ''}`}>
          {thinking ? (
            <span class="chat-stop" />
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" />
            </svg>
          )}
        </span>
      </div>
    </div>
  );
}
