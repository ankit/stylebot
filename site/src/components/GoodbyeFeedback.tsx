import { useState } from 'preact/hooks';
import { LINKS } from '../lib/links';

const REASONS = [
  'Didn’t need it anymore',
  'Hard to use',
  'It broke a site',
  'Missing a feature',
  'Too slow',
  'Something else',
];

/**
 * Optional uninstall survey: pick any reasons, add a note, and send it.
 */
export default function GoodbyeFeedback() {
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
    const body = [picked.join(', '), note.trim()].filter(Boolean).join('\n\n');
    const params = new URLSearchParams({
      subject: 'Stylebot uninstall feedback',
      body,
    });
    window.location.href = `mailto:${LINKS.feedbackEmail}?${params}`;
    setSent(true);
  };

  if (sent) {
    return <div class="gb-thanks">Thank you. Every note gets read.</div>;
  }

  return (
    <div class="gb-form">
      <div class="gb-q">
        Why did you uninstall? <span>Optional, takes a second.</span>
      </div>
      <div class="gb-reasons">
        {REASONS.map((reason) => (
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
        placeholder="Anything else? (optional)"
        aria-label="Anything else? (optional)"
        value={note}
        onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
      />
      <div class="gb-send">
        <button class="btn btn-primary" disabled={!ready} onClick={send}>
          Send feedback
        </button>
        <span>Goes straight to the maintainer.</span>
      </div>
    </div>
  );
}
