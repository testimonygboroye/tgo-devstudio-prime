interface CharacterCounterProps {
  current: number;
  max: number;
}

export default function CharacterCounter({ current, max }: CharacterCounterProps) {
  const isOverLimit = current > max;
  return (
    <p className={`mt-1 text-xs ${isOverLimit ? "text-red-400" : "text-neutral-400"}`}>
      {current} / {max}
    </p>
  );
}
