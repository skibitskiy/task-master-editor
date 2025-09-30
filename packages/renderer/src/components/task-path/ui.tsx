import { Flex, Popup, Text } from '@gravity-ui/uikit';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../redux/store';
import { truncatePath } from './lib/truncate-path';
import styles from './styles.module.css';

export const TaskPath: React.FC = () => {
  const [pathElement, setPathElement] = useState<HTMLElement | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const filePath = useSelector((state: RootState) => state.data.filePath);

  if (!filePath) {
    return null;
  }

  const truncatedPath = truncatePath(filePath);

  return (
    <Flex direction="column" gap={1}>
      <Text
        variant="header-1"
        className={styles.pathText}
        ref={setPathElement}
        onMouseEnter={() => setIsPopupOpen(true)}
        onMouseLeave={() => setIsPopupOpen(false)}
      >
        {truncatedPath}
      </Text>

      {pathElement && (
        <Popup
          anchorElement={pathElement}
          open={isPopupOpen}
          placement="bottom"
          disableLayer
          className={styles.popupContainer}
        >
          <Text className={styles.popupContent} variant="body-1" color="secondary">
            {filePath}
          </Text>
        </Popup>
      )}
    </Flex>
  );
};
