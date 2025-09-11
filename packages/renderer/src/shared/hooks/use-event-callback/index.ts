import { useCallback, useImperativeHandle, useRef } from 'react';

export function useEventCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef<T>(callback);

  useImperativeHandle(callbackRef, () => callback);

  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
}
