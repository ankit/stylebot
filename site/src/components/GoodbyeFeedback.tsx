import { useState } from 'preact/hooks';
import type { SiteMessages } from '../i18n';

type Props = { messages: SiteMessages['goodbye']['feedback'] };

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props: Record<string, string> },
    ) => void;
  }
}

// Same order as `reasons` in every locale, so reports don't split by language.
const REASON_KEYS = [
  'not-needed',
  'hard-to-use',
  'broke-a-site',
  'missing-feature',
  'too-slow',
  'other',
];

/**
 * Optional uninstall survey: pick any reasons, add a note, and send it.
 */
export default function GoodbyeFeedback({ messages: t }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const ready = picked.length > 0 || note.trim().length > 0;

  const toggle = (reason: string) =>
    setPicked((p) =>
      p.includes(reason) ? p.filter((r) => r !== reason) : [...p, reason],
    );

  const send = () => {
    if (!ready) return;
    picked.forEach((reason) =>
      window.plausible?.('Uninstall reason', {
        props: { reason: REASON_KEYS[t.reasons.indexOf(reason)] },
      }),
    );
    if (note.trim()) {
      window.plausible?.('Uninstall note', {
        props: { note: note.trim().slice(0, 2000) },
      });
    }
    setSent(true);
  };

  if (sent) {
    return <div class="gb-thanks">{t.thanks}</div>;
  }

  return (
    <div class="gb-form">
      <div class="gb-q">
        {t.question} <span>{t.optional}</span>
      </div>
      <div class="gb-reasons">
        {t.reasons.map((reason) => (
          <button
            key={reason}
            class={`gb-chip${picked.includes(reason) ? ' is-on' : ''}`}
            aria-pressed={picked.includes(reason)}
            onClick={() => toggle(reason)}
          >
            {reason}
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        placeholder={t.placeholder}
        aria-label={t.placeholder}
        value={note}
        onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
      />
      <div class="gb-send">
        <button class="btn btn-primary" disabled={!ready} onClick={send}>
          {t.send}
        </button>
        <span>{t.sendNote}</span>
      </div>
    </div>
  );
}
