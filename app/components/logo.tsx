type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        className="fill-neutral-900 dark:fill-neutral-100"
        d="M9 3h11l9 9v12a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z"
      />
      <path
        className="fill-neutral-500 dark:fill-neutral-400"
        d="M20 3v5a4 4 0 0 0 4 4h5"
      />
      <g
        className="stroke-white dark:stroke-neutral-950"
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        <circle cx="15.8" cy="19.5" r="4.2" />
        <path d="M20 15.3v8.4" />
      </g>
    </svg>
  );
}
