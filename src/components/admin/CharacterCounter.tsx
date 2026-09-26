interface CharacterCounterProps {
  current: number;
  max: number;
}

export default function CharacterCounter({ current, max }: CharacterCounterProps) {
  const isOverLimit = current > max;
  return (
    <p className={`mt-1.5 text-xs font-mono ${isOverLimit ? "text-red-400 font-semibold" : "text-[var(--text-muted)]"}`}>
      {current} / {max} characters
    </p>
  );
}
