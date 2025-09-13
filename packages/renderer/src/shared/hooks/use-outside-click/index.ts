import * as React from 'react';

interface UseOutsideClickOptions {
  refs: React.RefObject<Element | null>[];
  handler: (event: Event) => void;
  enabled?: boolean;
}

/**
 * Hook for observing clicks outside given targets
 * Supports both single ref and multiple refs
 *
 * @param options.refs - array of refs to observe
 * @param options.handler - callback when a click is triggered outside all observation targets
 * @param options.enabled - whether the hook is enabled (default: true)
 */
export const useOutsideClick = (options: UseOutsideClickOptions) => {
  const { handler, enabled = true, refs } = options;

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const callback = (event: Event) => {
      const target = event.target as Element;

      // Check if the click is inside any of the referenced elements
      const isInsideAny = refs.some((ref) => {
        const elem = ref?.current;
        return elem && elem.contains(target);
      });

      // If the click is outside all referenced elements, call the handler
      if (!isInsideAny && handler) {
        handler(event);
      }
    };

    // Use capture phase to ensure we catch the event before it bubbles
    document.addEventListener('mousedown', callback, { capture: true });
    document.addEventListener('touchstart', callback, { capture: true });

    return () => {
      document.removeEventListener('mousedown', callback, { capture: true });
      document.removeEventListener('touchstart', callback, { capture: true });
    };
  }, [handler, refs, enabled]);
};
