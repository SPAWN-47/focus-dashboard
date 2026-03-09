import { useEffect } from "react";

export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    document.body.style.overflow = isLocked ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLocked]);
}
