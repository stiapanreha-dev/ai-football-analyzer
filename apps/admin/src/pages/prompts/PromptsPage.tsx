import { useState, useEffect } from 'react';
import { Card, Tab, Tabs, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import type { PromptKey } from '@archetypes/shared';
import { PROMPT_LABELS, PROMPT_PLACEHOLDERS } from '@archetypes/shared';

import { usePrompts, useUpdatePrompt, useTestPrompt } from '@/features/prompts/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

export function PromptsPage() {
  const [activeKey, setActiveKey] = useState<PromptKey>('prompt_situation');
  const [editedValues, setEditedValues] = useState<Record<PromptKey, string>>({} as Record<PromptKey, string>);
  const [testResult, setTestResult] = useState<string | null>(null);

  const { data: prompts, isLoading, error, refetch } = usePrompts();
  const updateMutation = useUpdatePrompt();
  const testMutation = useTestPrompt();

  // Инициализируем editedValues когда загружаются данные
  useEffect(() => {
    if (prompts) {
      const values: Record<string, string> = {};
      for (const prompt of prompts) {
        values[prompt.key] = prompt.value;
      }
      setEditedValues(values as Record<PromptKey, string>);
    }
  }, [prompts]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message="Не удалось загрузить промпты" onRetry={refetch} />;
  }

  const currentPrompt = prompts?.find((p) => p.key === activeKey);
  const currentValue = editedValues[activeKey] ?? '';
  const hasChanges = currentPrompt && currentValue !== currentPrompt.value;

  const handleSave = () => {
    updateMutation.mutate(
      { key: activeKey, value: currentValue },
      {
        onSuccess: () => {
          setTestResult(null);
        },
      }
    );
  };

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate(
      { key: activeKey, template: currentValue },
      {
        onSuccess: (data) => {
          setTestResult(data.result);
        },
      }
    );
  };

  const handleValueChange = (value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [activeKey]: value,
    }));
  };

  const placeholders = PROMPT_PLACEHOLDERS[activeKey];

  return (
    <div>
      <h4 className="mb-4">Редактор промптов</h4>

      <Card>
        <Card.Header className="p-0">
          <Tabs
            activeKey={activeKey}
            onSelect={(k) => {
              if (k) {
                setActiveKey(k as PromptKey);
                setTestResult(null);
              }
            }}
            className="nav-tabs-card"
          >
            {Object.entries(PROMPT_LABELS).map(([key, label]) => (
              <Tab key={key} eventKey={key} title={label} />
            ))}
          </Tabs>
        </Card.Header>

        <Card.Body>
          {/* Плейсхолдеры */}
          <div className="mb-3">
            <small className="text-muted">Доступные плейсхолдеры:</small>
            <div className="mt-1">
              {placeholders.map((p) => (
                <Badge
                  key={p}
                  bg="light"
                  text="dark"
                  className="me-1 mb-1 font-monospace"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    navigator.clipboard.writeText(p);
                  }}
                  title="Нажмите чтобы скопировать"
                >
                  {p}
                </Badge>
              ))}
            </div>
          </div>

          {/* Редактор */}
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={18}
              value={currentValue}
              onChange={(e) => handleValueChange(e.target.value)}
              className="font-monospace"
              style={{ fontSize: '13px' }}
            />
          </Form.Group>

          {/* Кнопки */}
          <div className="d-flex gap-2 mb-3">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>

            <Button
              variant="outline-secondary"
              onClick={handleTest}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Тестирование...
                </>
              ) : (
                'Тестировать'
              )}
            </Button>

            {hasChanges && (
              <span className="text-warning align-self-center ms-2">
                * Есть несохранённые изменения
              </span>
            )}
          </div>

          {/* Уведомления */}
          {updateMutation.isSuccess && (
            <Alert variant="success" className="mb-3">
              Промпт успешно сохранён
            </Alert>
          )}

          {updateMutation.isError && (
            <Alert variant="danger" className="mb-3">
              Ошибка сохранения: {(updateMutation.error as Error).message}
            </Alert>
          )}

          {testMutation.isError && (
            <Alert variant="danger" className="mb-3">
              Ошибка тестирования: {(testMutation.error as Error).message}
            </Alert>
          )}

          {/* Результат теста */}
          {testResult && (
            <Card className="bg-light">
              <Card.Header>
                <strong>Результат теста:</strong>
              </Card.Header>
              <Card.Body>
                <pre
                  className="mb-0"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '13px',
                  }}
                >
                  {testResult}
                </pre>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
