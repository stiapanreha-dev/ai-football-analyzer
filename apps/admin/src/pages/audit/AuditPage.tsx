import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Card, Form, Row, Col, Badge, Pagination, Spinner, Alert } from 'react-bootstrap';

import { api } from '@/shared/api/client';

interface AuditLog {
  id: number;
  timestamp: string;
  source: string;
  action: string;
  telegramId: string | null;
  playerId: number | null;
  sessionId: string | null;
  data: Record<string, unknown> | null;
  success: boolean;
  errorMsg: string | null;
  playerName?: string | null;
}

interface AuditLogsResponse {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const sourceLabels: Record<string, { label: string; variant: string }> = {
  bot: { label: 'Bot', variant: 'primary' },
  backend: { label: 'Backend', variant: 'secondary' },
  admin: { label: 'Admin', variant: 'info' },
};

const actionLabels: Record<string, string> = {
  start_command: '/start',
  help_command: '/help',
  language_command: '/language',
  cancel_command: '/cancel',
  start_test_clicked: 'Start Test',
  pin_entered: 'PIN ввод',
  pin_validated: 'PIN OK',
  pin_invalid: 'PIN ошибка',
  pin_expired: 'PIN истёк',
  pin_exhausted: 'PIN исчерпан',
  registration_started: 'Регистрация',
  registration_name_entered: 'Имя введено',
  registration_position_selected: 'Позиция выбрана',
  registration_completed: 'Регистрация OK',
  session_started: 'Сессия старт',
  session_created: 'Сессия создана',
  situation_received: 'Ситуация',
  answer_submitted: 'Ответ',
  clarification_submitted: 'Уточнение',
  session_completed: 'Сессия OK',
  session_abandoned: 'Сессия отменена',
  voice_received: 'Голос получен',
  voice_transcribed: 'Голос транскр.',
  voice_transcription_failed: 'Голос ошибка',
  continue_flow_clicked: 'Продолжить',
  language_changed: 'Смена языка',
  error: 'Ошибка',
  api_error: 'API ошибка',
};

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [sourceFilter, setSourceFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', page, pageSize, sourceFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (sourceFilter) params.append('source', sourceFilter);
      if (actionFilter) params.append('action', actionFilter);

      const response = await api.get<AuditLogsResponse>(`/audit?${params}`);
      return response.data;
    },
    refetchInterval: 5000,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatData = (data: Record<string, unknown> | null) => {
    if (!data) return '-';
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
  };

  const uniqueActions: string[] = data?.items
    ? [...new Set(data.items.map((log: AuditLog) => log.action))]
    : [];

  return (
    <>
      <h2 className="mb-4">Аудит лог</h2>

      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Источник</Form.Label>
                <Form.Select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Все</option>
                  <option value="bot">Bot</option>
                  <option value="backend">Backend</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Действие</Form.Label>
                <Form.Select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Все</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {actionLabels[action] || action}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              {data && (
                <small className="text-muted">
                  Всего: {data.total} записей
                </small>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading && (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      )}

      {error && (
        <Alert variant="danger">
          Ошибка загрузки: {error instanceof Error ? error.message : 'Unknown'}
        </Alert>
      )}

      {data && (
        <>
          <Card>
            <Table striped hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Источник</th>
                  <th>Действие</th>
                  <th>Игрок</th>
                  <th>Сессия</th>
                  <th>Данные</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log: AuditLog) => (
                  <tr key={log.id} className={!log.success ? 'table-danger' : ''}>
                    <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td>
                      <Badge
                        bg={sourceLabels[log.source]?.variant || 'secondary'}
                      >
                        {sourceLabels[log.source]?.label || log.source}
                      </Badge>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem' }}>
                        {actionLabels[log.action] || log.action}
                      </code>
                    </td>
                    <td>
                      {log.playerName ? (
                        <span title={`ID: ${log.playerId}`}>{log.playerName}</span>
                      ) : log.telegramId ? (
                        <small className="text-muted">TG: {log.telegramId}</small>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {log.sessionId ? (
                        <small className="text-muted">{log.sessionId.slice(0, 8)}...</small>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ maxWidth: '300px', fontSize: '0.8rem' }}>
                      <span
                        className="text-truncate d-inline-block"
                        style={{ maxWidth: '300px' }}
                        title={formatData(log.data)}
                      >
                        {formatData(log.data)}
                      </span>
                    </td>
                    <td>
                      {log.success ? (
                        <Badge bg="success">OK</Badge>
                      ) : (
                        <Badge bg="danger" title={log.errorMsg || ''}>
                          Error
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {data.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.First
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                />
                <Pagination.Prev
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                />
                {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2 + i, data.totalPages - 4 + i));
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === page}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                />
                <Pagination.Last
                  onClick={() => setPage(data.totalPages)}
                  disabled={page === data.totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </>
  );
}
