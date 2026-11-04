interface Props {
  className?: string;
}

export default function Skeleton({ className = "" }: Props) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-lg bg-white/15 motion-reduce:animate-none ${className}`}
    />
  );
}
