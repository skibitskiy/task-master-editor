import { isTaskField, TaskFieldWords } from '@app/shared';
import Mention from '@tiptap/extension-mention';
import { EditorContent, ReactRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SuggestionProps } from '@tiptap/suggestion';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { useCombineRefs } from '@/shared/hooks';

import { SuggestionsPopup, type SuggestionsPopupProps } from '../suggestions-popup';
import styles from './styles.module.css';

interface TiptapEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onEnterPress?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  suggestPopupRef?: React.RefObject<HTMLDivElement | null>;
}

export type TiptapEditorRef = {
  focus: () => void;
  clear: () => void;
  getHTML: () => string;
  getText: () => string;
};

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  (
    { value, suggestPopupRef, onChange, onEnterPress, placeholder = 'Введите сообщение...', disabled, className },
    ref,
  ) => {
    const isSuggestPopupOpen = useRef(false);
    const handleSuggestPopupOpen = useCallback(() => {
      isSuggestPopupOpen.current = true;
    }, []);
    const handleSuggestPopupClose = useCallback(() => {
      isSuggestPopupOpen.current = false;
    }, []);

    const tiptapEditorRef = useRef<TiptapEditorRef>(null);

    const combinedRef = useCombineRefs(tiptapEditorRef, ref);

    const componentRef: React.RefObject<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean } | null> =
      useRef(null);

    const editor = useEditor({
      extensions: [
        StarterKit,
        Mention.configure({
          HTMLAttributes: {
            class: styles.mention,
          },
          renderHTML: ({ node, suggestion }) => {
            return [
              'span',
              {
                'data-type': 'mention',
                'data-id': node.attrs.id,
                'data-label': node.attrs.label,
                class: styles.mention,
              },
              `${suggestion?.char}${node.attrs.label}`,
            ];
          },
          suggestion: {
            items: ({ query }) => {
              return Object.keys(TaskFieldWords)
                .map((item) => {
                  if (isTaskField(item)) {
                    return {
                      id: item,
                      label: TaskFieldWords[item],
                    };
                  }
                  return null;
                })
                .filter((item) => item?.label?.toLowerCase().startsWith(query.toLowerCase()));
            },

            render: () => {
              let component: ReactRenderer<
                React.RefObject<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }>,
                SuggestionsPopupProps
              >;

              const transformProps = (props: SuggestionProps<{ id: string; label: string }>): SuggestionsPopupProps => {
                return {
                  items: props.items,
                  anchorElement: props.decorationNode,
                  command: props.command,
                  forwardedRef: componentRef,
                  popupRef: suggestPopupRef,
                  onSuggestPopupOpen: handleSuggestPopupOpen,
                  onSuggestPopupClose: handleSuggestPopupClose,
                };
              };

              return {
                onStart: (props) => {
                  const componentProps: SuggestionsPopupProps = {
                    open: true,
                    ...transformProps(props),
                  };

                  component = new ReactRenderer<
                    React.RefObject<{ onKeyDown: (p: { event: KeyboardEvent }) => boolean }>,
                    SuggestionsPopupProps
                  >(SuggestionsPopup, {
                    props: componentProps,
                    editor: props.editor,
                  });
                },

                onUpdate(props) {
                  component.updateProps(transformProps(props));
                },

                onKeyDown(props) {
                  console.log('onKeyDown', props, component, componentRef);

                  if (props.event.key === 'Escape') {
                    component.destroy();

                    return true;
                  }

                  return Boolean(componentRef.current?.onKeyDown?.({ event: props.event }));
                },

                onExit() {
                  component.element.remove();
                  component.destroy();
                },
              };
            },
          },
        }),
      ],
      content: value || '',
      editable: !disabled,
      editorProps: {
        attributes: {
          class: `${styles.editor} ${className || ''}`,
          placeholder,
        },
        handleKeyDown: (view, event) => {
          console.log(
            'TiptapEditor handleKeyDown',
            event.key === 'Enter',
            !isSuggestPopupOpen.current,
            !event.shiftKey,
            !event.ctrlKey,
            !event.metaKey,
          );
          if (
            event.key === 'Enter' &&
            !isSuggestPopupOpen.current &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey
          ) {
            event.preventDefault();
            if (onEnterPress) {
              const text = tiptapEditorRef.current?.getHTML();
              if (text?.trim()) {
                onEnterPress(text);
                view.dispatch(view.state.tr.delete(0, view.state.doc.content.size));
              }
            }
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: editorInstance }) => {
        const html = editorInstance.getHTML();
        onChange?.(html);
      },
    });

    useImperativeHandle(combinedRef, () => ({
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(),
      getHTML: () => editor?.getHTML() || '',
      getText: () => editor?.getText() || '',
    }));

    return (
      <div className={styles.wrapper}>
        <EditorContent editor={editor} role="presentation" />
      </div>
    );
  },
);

TiptapEditor.displayName = 'TiptapEditor';

export { TiptapEditor };
