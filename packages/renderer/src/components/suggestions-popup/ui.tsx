import { DropdownMenu, DropdownMenuItem, PopupProps } from '@gravity-ui/uikit';
import { useEffect, useImperativeHandle, useState } from 'react';

export type SuggestionsPopupProps = Pick<PopupProps, 'anchorElement' | 'open'> & {
  items: { id: string; label: string }[];
  command: (params: { id: string; label: string }) => void;
  forwardedRef?: React.RefObject<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean } | null>;
  popupRef?: React.RefObject<HTMLDivElement | null>;
  onSuggestPopupOpen?: () => void;
  onSuggestPopupClose?: () => void;
};

export const SuggestionsPopup = ({
  items = [],
  command,
  forwardedRef,
  anchorElement,
  open,
  popupRef,
  onSuggestPopupOpen,
  onSuggestPopupClose,
}: SuggestionsPopupProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];

    if (item) {
      command({ id: item.id, label: item.label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(forwardedRef, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  const dropdownItems: DropdownMenuItem[] = items.map((item, index) => ({
    text: item.label,
    selected: index === selectedIndex,
    action: () => selectItem(index),
  }));

  useEffect(() => {
    if (open) {
      onSuggestPopupOpen?.();
    } else {
      onSuggestPopupClose?.();
    }

    return () => {
      onSuggestPopupClose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <DropdownMenu
      items={dropdownItems}
      popupProps={{
        anchorElement: anchorElement,
        floatingRef: popupRef,
        onOpenChange: (value) => {
          if (value) {
            onSuggestPopupOpen?.();
          } else {
            onSuggestPopupClose?.();
          }
        },
      }}
      open={open}
    />
  );
};
