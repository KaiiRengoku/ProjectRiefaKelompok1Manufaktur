import { useEffect, useState } from "react";

export function useCountUp(end: number, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setValue(0);
      return;
    }
    let startTime: number | null = null;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    let frameId: number;

    const animate = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(end * easeOutCubic(progress)));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration]);

  return value;
}
