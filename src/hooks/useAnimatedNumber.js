import { animate, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function useAnimatedNumber(value) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const unsubscribe = rounded.on("change", setDisplayValue);
    const controls = animate(count, value, {
      duration: 2,
      type: "tween",
      ease: "easeOut",
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, rounded, value]);

  return displayValue;
}
