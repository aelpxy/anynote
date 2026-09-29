import { useEffect, useEffectEvent } from "react";

export function useHotkey(key: string, onTrigger: () => void) {
  const handleTrigger = useEffectEvent(onTrigger);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key) {
        event.preventDefault();
        handleTrigger();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key]);
}
