import { Select } from '@gravity-ui/uikit';
import React, { useEffect, useState } from 'react';
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
  const [currentModel, setCurrentModel] = useState(value || 'anthropic/claude-3.5-sonnet');

  useEffect(() => {
    const config = gptService.getConfig();
    if (config && !value) {
      setCurrentModel(config.model);
    }
  }, [value]);

  useEffect(() => {
    if (value) {
      setCurrentModel(value);
    }
  }, [value]);

  const handleModelChange = (values: string[]) => {
    const newModel = values[0];
    setCurrentModel(newModel);

    if (onUpdate) {
      onUpdate(newModel);
    } else {
      // If no custom handler, update gptService directly
      const config = gptService.getConfig();
      if (config) {
        gptService.setConfig({
          ...config,
          model: newModel,
        });
        // Store in localStorage for persistence
        localStorage.setItem(
          'gptConfig',
          JSON.stringify({
            ...config,
            model: newModel,
          }),
        );
      }
    }
  };

  // Combine default models with custom models
  const allModels = [
    ...DEFAULT_MODELS,
    ...customModels.map((customModel) => ({
      value: customModel.value,
      content: customModel.name,
    })),
  ];

  return (
    <Select
      className={className}
      placeholder="Выберите модель"
      value={[currentModel]}
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
