import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  value: number;
  duration?: number;
  format?: (v: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, duration = 800, format, className }: Props) {
  const animated = useCountUp(value, duration);
  return <span className={className}>{format ? format(animated) : animated}</span>;
}
