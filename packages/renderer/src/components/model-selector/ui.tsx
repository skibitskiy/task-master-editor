import { Select } from '@gravity-ui/uikit';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '../../redux/store';
import { gptService } from '../../services/gpt-service';

interface ModelSelectorProps {
  value?: string;
  onUpdate?: (value: string) => void;
  size?: 's' | 'm' | 'l' | 'xl';
  width?: 'max' | number;
  className?: string;
  popupRef?: React.RefObject<HTMLDivElement | null>;
}

const DEFAULT_MODELS = [
  { value: 'openai/gpt-4o', content: 'GPT-4o' },
  { value: 'openai/o3', content: 'GPT-o3' },
  { value: 'openai/gpt-5', content: 'GPT-5' },
  { value: 'openai/gpt-5-mini', content: 'GPT-5 Mini' },
  { value: 'openai/gpt-5-nano', content: 'GPT-5 Nano' },
  { value: 'anthropic/claude-sonnet-4', content: 'Claude Sonnet 4' },
  { value: 'x-ai/grok-code-fast-1', content: 'Grok Code Fast 1' },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onUpdate,
  size = 'm',
  width = 'max',
  className,
  popupRef,
}) => {
  const customModels = useSelector((state: RootState) => state.settings.data.customModels || []);
  const [currentModel, setCurrentModel] = useState(() => {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    return gptService.config.model;
  });

  useEffect(() => {
    if (typeof value === 'string') {
      setCurrentModel(value);
    }
  }, [value]);

  useEffect(() => {
    if (value !== undefined) {
      return;
    }

    const unsubscribe = gptService.subscribe((config) => {
      setCurrentModel(config.model);
    });

    return unsubscribe;
  }, [value]);

  const handleModelChange = (values: string[]) => {
    const newModel = values[0];
    setCurrentModel(newModel);

    if (onUpdate) {
      onUpdate(newModel);
    } else {
      gptService.setModel(newModel);
    }
  };

  // Combine default models with custom models
  const allModels = useMemo(
    () => [
      ...DEFAULT_MODELS,
      ...customModels.map((customModel) => ({
        value: customModel.value,
        content: customModel.name,
      })),
    ],
    [customModels],
  );

  const selectValue = currentModel ? [currentModel] : [];

  return (
    <Select
      className={className}
      placeholder="Выберите модель"
      value={selectValue}
      onUpdate={handleModelChange}
      options={allModels}
      size={size}
      width={width}
      renderPopup={({ renderList, renderFilter }) => {
        return (
          <div ref={popupRef}>
            {renderFilter()}
            {renderList()}
          </div>
        );
      }}
    />
  );
};
