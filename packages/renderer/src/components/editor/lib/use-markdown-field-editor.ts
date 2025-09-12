import React from 'react';
import {
  useMarkdownEditor,
  gptExtension,
  mGptExtension,
  wGptItemData,
  mGptToolbarItem,
  wysiwygToolbarConfigs,
  markupToolbarConfigs,
  type ExtensionBuilder,
} from '@gravity-ui/markdown-editor';
import cloneDeep from 'lodash/cloneDeep';
import type { TaskFieldTab } from './types';
import { gptWidgetOptions } from './gpt-widget-config';

interface UseMarkdownFieldEditorParams {
  field: Extract<TaskFieldTab, 'description' | 'details' | 'testStrategy'>;
  initialValue: string;
  onChange: (field: TaskFieldTab, value: string) => void;
}

// Configure wysiwyg toolbar with GPT
const wToolbarConfig = [[wGptItemData], ...cloneDeep(wysiwygToolbarConfigs.wToolbarConfig)];

// Configure selection menu with GPT
const wSelectionMenuConfig = [[wGptItemData], ...cloneDeep(wysiwygToolbarConfigs.wSelectionMenuConfig)];

// Configure command menu with GPT
const wCommandMenuConfig = [wGptItemData, ...cloneDeep(wysiwygToolbarConfigs.wCommandMenuConfig)];

// Configure markup toolbar with GPT
const mToolbarConfig = [[mGptToolbarItem], ...cloneDeep(markupToolbarConfigs.mToolbarConfig)];

export const useMarkdownFieldEditor = ({ field, initialValue, onChange }: UseMarkdownFieldEditorParams) => {
  const markupGptExtension = mGptExtension(gptWidgetOptions);

  const editor = useMarkdownEditor({
    initial: { markup: initialValue },
    md: {
      html: true,
    },
    markupConfig: {
      extensions: markupGptExtension,
    },
    wysiwygConfig: {
      extensions: (builder: ExtensionBuilder) => builder.use(gptExtension, gptWidgetOptions),
      extensionOptions: {
        selectionContext: { config: wSelectionMenuConfig },
        commandMenu: { actions: wCommandMenuConfig },
      },
    },
  });

  React.useEffect(() => {
    const handler = (_: null) => onChange(field, editor.getValue());
    editor.on('change', handler);

    return () => {
      editor.off('change', handler);
    };
  }, [editor, field, onChange]);

  return {
    editor,
    toolbarConfigs: {
      wysiwyg: wToolbarConfig,
      markup: mToolbarConfig,
    },
  };
};
