import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  postToExtension,
  readStatusReply,
  type ExtensionStatus,
} from '../lib/cli-handshake';

const POLL_MS = 2000;

/**
 * Live setup checklist, shown once Stylebot on this page answers a status
 * request. It renders nothing when nothing answers, leaving the static steps.
 */
export default function CliStatus() {
  const [status, setStatus] = useState<ExtensionStatus | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const reply = readStatusReply(event);
      if (reply) setStatus(reply);
    };
    const ask = () => {
      if (document.visibilityState === 'visible') postToExtension('status');
    };

    window.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', ask);
    ask();
    const timer = setInterval(ask, POLL_MS);
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', ask);
      clearInterval(timer);
    };
  }, []);

  if (!status) return null;

  const ready = status.cliEnabled && status.cliConnected;
  return (
    <div class="cli-status" aria-live="polite">
      <div class="cli-status-head">
        <strong>{ready ? 'You’re all set.' : 'In this browser'}</strong>
        <span>
          {ready
            ? 'Ask your coding agent to restyle a site.'
            : 'This updates as you go.'}
        </span>
      </div>
      <ul>
        <Item done label="Stylebot installed" detail={`v${status.version}`} />
        <Item done={status.cliEnabled} label="Command line access on">
          {!status.cliEnabled && (
            <button
              type="button"
              class="btn btn-primary cli-status-btn"
              onClick={() => postToExtension('open-cli-settings')}
            >
              Turn it on
            </button>
          )}
        </Item>
        <Item done={status.cliConnected} label="CLI connected">
          {status.cliEnabled && !status.cliConnected && (
            <span class="cli-status-hint">
              Run <code>stylebot install</code>
            </span>
          )}
        </Item>
      </ul>
    </div>
  );
}

type ItemProps = {
  done: boolean;
  label: string;
  detail?: string;
  children?: ComponentChildren;
};

/**
 * One checklist row: a mark, its label, and an optional action.
 */
function Item({ done, label, detail, children }: ItemProps) {
  return (
    <li class={done ? 'is-done' : undefined}>
      <span
        class="cli-status-mark"
        role="img"
        aria-label={done ? 'Done' : 'Not yet'}
      >
        {done ? '✓' : '×'}
      </span>
      <span class="cli-status-label">
        {label}
        {detail && <span class="cli-status-detail">{detail}</span>}
      </span>
      {children}
    </li>
  );
}
