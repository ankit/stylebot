const chevron = (d: string) => () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export const ChevronDown = chevron('M2 3.5 5 6.5 8 3.5');

export const ChevronUp = chevron('M2 6.5 5 3.5 8 6.5');

export const Close = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
  </svg>
);

export const EyeOff = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M1.5 8c1.5-3 4-4.5 6.5-4.5S13.5 5 14.5 8c-1.5 3-4 4.5-6.5 4.5S2.5 11 1.5 8z" />
    <circle cx="8" cy="8" r="1.6" />
    <path d="M2.5 13.5l11-11" />
  </svg>
);
