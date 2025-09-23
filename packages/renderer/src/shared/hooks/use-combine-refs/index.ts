import { useCallback } from 'react';

export function useCombineRefs<T>(...refs: (React.RefObject<T> | React.RefCallback<T> | null)[]): React.RefCallback<T> {
  return useCallback((node: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}
