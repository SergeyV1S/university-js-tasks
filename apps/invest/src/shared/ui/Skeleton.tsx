export const Skeleton = ({ className = "" }: { className?: string }) => (
  <span aria-hidden="true" className={`block rounded bg-invest-skeleton ${className}`} />
);
