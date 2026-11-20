/** The Runway mark: a runway seen from the approach, centre line in yellow. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="3" fill="var(--ink)" />
      <path d="M9 3h6l3 18H6z" fill="#3b4048" />
      <path d="M12 5v3M12 10.5v3M12 16v3" stroke="var(--signal)" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}
