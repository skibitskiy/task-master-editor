import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Flex } from '@gravity-ui/uikit';
import { notifyError } from '../utils/notify';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    notifyError(
      'Произошла ошибка приложения',
      'Приложение обнаружило неожиданную ошибку. Попробуйте перезагрузить страницу.',
    );

    if (window.electron?.log) {
      window.electron.log.error('React ErrorBoundary caught error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Flex className="error-boundary-fallback" direction="column" gap={4} centerContent>
          <Alert
            theme="danger"
            title="Что-то пошло не так"
            message={
              <div>
                <p>Приложение столкнулось с неожиданной ошибкой.</p>
                {this.state.error && (
                  <details style={{ marginTop: '10px' }}>
                    <summary>Подробности ошибки</summary>
                    <pre
                      style={{
                        fontSize: '12px',
                        padding: '10px',
                        backgroundColor: 'var(--g-color-base-generic)',
                        borderRadius: '4px',
                        overflow: 'auto',
                        maxHeight: '200px',
                      }}
                    >
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            }
          />
          <Flex gap={2}>
            <Button view="action" size="l" onClick={this.handleReset}>
              Попробовать снова
            </Button>
            <Button view="outlined" size="l" onClick={this.handleReload}>
              Перезагрузить приложение
            </Button>
          </Flex>
        </Flex>
      );
    }

    return this.props.children;
  }
}
