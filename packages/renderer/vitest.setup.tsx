import '@testing-library/jest-dom';

import React from 'react';
import { vi } from 'vitest';

// Mock CSS modules - return kebab-case class names for testing
vi.mock('*.module.css', () => {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          // Convert camelCase to kebab-case for CSS class names
          const kebabCase = prop.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
          return kebabCase;
        }
        return undefined;
      },
    },
  );
});

// Mock the List component to avoid virtualization issues in tests
vi.mock('@gravity-ui/uikit', async () => {
  const actual = await vi.importActual('@gravity-ui/uikit');
  return {
    ...actual,
    List: ({
      items,
      renderItem,
      filterItem,
      filterPlaceholder,
      emptyPlaceholder,
      onItemClick,
    }: {
      items: unknown[];
      renderItem: (item: unknown, isActive: boolean, index: number) => React.ReactNode;
      filterItem: (query: string) => (item: unknown) => boolean;
      filterPlaceholder: string;
      emptyPlaceholder: React.ReactNode;
      onItemClick?: (item: unknown, index: number) => void;
    }) => {
      const [filter, setFilter] = React.useState('');
      const filteredItems = filter ? items.filter((item: unknown) => filterItem(filter)(item)) : items;

      return (
        <div role="list">
          <div className="g-list__filter">
            <input placeholder={filterPlaceholder} value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="g-list__items">
            {filteredItems.length === 0
              ? emptyPlaceholder
              : filteredItems.map((item: unknown, index: number) => (
                  <div key={String((item as { id: unknown }).id) || index} onClick={() => onItemClick?.(item, index)}>
                    {renderItem(item, false, index)}
                  </div>
                ))}
          </div>
        </div>
      );
    },
  };
});
