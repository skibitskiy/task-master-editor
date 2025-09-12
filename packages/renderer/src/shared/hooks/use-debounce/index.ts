import debounce from 'lodash/debounce';
import { useEffect, useMemo } from 'react';

import { useEventCallback } from '../use-event-callback';

export function useDebounce<T extends () => unknown>(callback: T, deps: unknown[], delay: number) {
  const eventCallback = useEventCallback(callback);
  const debouncedCallback = useMemo(() => debounce(eventCallback, delay), [eventCallback, delay]);

  useEffect(() => {
    debouncedCallback(...([] as Parameters<T>));

    return () => {
      debouncedCallback.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCallback, ...deps]);
}
