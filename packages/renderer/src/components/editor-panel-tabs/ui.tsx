import { CircleExclamation } from '@gravity-ui/icons';
import { Flex, Tab, TabList, TabProvider } from '@gravity-ui/uikit';
import React from 'react';

interface TabInfo {
  id: string;
  title: string;
  isDirty: boolean;
  hasError: boolean;
}

interface EditorPanelTabsProps {
  active: string;
  tabs: TabInfo[];
  onChange: (value: string) => void;
}

export const EditorPanelTabs: React.FC<EditorPanelTabsProps> = ({ active, tabs, onChange }) => {
  return (
    <TabProvider value={active} onUpdate={(value) => onChange(String(value))}>
      <TabList>
        {tabs.map((tab) => (
          <Tab key={tab.id} value={tab.id}>
            <Flex gap={1} alignItems="center">
              {tab.title}
              {tab.isDirty && <span style={{ color: 'var(--g-color-text-warning)', fontSize: 12 }}>●</span>}
              {tab.hasError && (
                <CircleExclamation width={16} height={16} style={{ color: 'var(--g-color-text-danger)' }} />
              )}
            </Flex>
          </Tab>
        ))}
      </TabList>
    </TabProvider>
  );
};
