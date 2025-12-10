import { useState } from 'react';
import { Card, Table, Badge, Form, Pagination } from 'react-bootstrap';

import { useSessions } from '@/features/sessions/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime } from '@archetypes/shared';

const statusLabels: Record<string, { label: string; variant: string }> = {
  created: { label: 'Создана', variant: 'secondary' },
  in_progress: { label: 'В процессе', variant: 'primary' },
  clarifying: { label: 'Уточнение', variant: 'info' },
  completed: { label: 'Завершена', variant: 'success' },
  abandoned: { label: 'Прервана', variant: 'danger' },
};

export function SessionsListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading, error, refetch } = useSessions({
    page,
    pageSize: 20,
    status: status || undefined,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message="Не удалось загрузить сессии" onRetry={refetch} />;
  }

  return (
    <div>
      <h4 className="mb-4">Сессии тестирования</h4>

      <Card className="mb-3">
        <Card.Body>
          <Form.Select
            style={{ maxWidth: '200px' }}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все статусы</option>
            <option value="completed">Завершённые</option>
            <option value="in_progress">В процессе</option>
            <option value="abandoned">Прерванные</option>
          </Form.Select>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Игрок</th>
                <th>Статус</th>
                <th>Язык</th>
                <th>Ситуаций</th>
                <th>Создана</th>
                <th>Завершена</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((session) => {
                const statusInfo = statusLabels[session.status] ?? {
                  label: session.status,
                  variant: 'secondary',
                };
                return (
                  <tr key={session.id}>
                    <td className="text-truncate" style={{ maxWidth: '150px' }}>
                      <small>{session.id.slice(0, 8)}...</small>
                    </td>
                    <td>{session.player.name ?? `Игрок #${session.playerId}`}</td>
                    <td>
                      <Badge bg={statusInfo.variant}>{statusInfo.label}</Badge>
                    </td>
                    <td>
                      <Badge bg="secondary">{session.language.toUpperCase()}</Badge>
                    </td>
                    <td>{session.situationsCount}</td>
                    <td>{formatDateTime(session.createdAt)}</td>
                    <td>
                      {session.completedAt ? (
                        formatDateTime(session.completedAt)
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!data?.items.length && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Сессии не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
        {data && data.totalPages > 1 && (
          <Card.Footer>
            <Pagination className="mb-0 justify-content-center">
              <Pagination.Prev
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              />
              {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <Pagination.Item
                  key={p}
                  active={p === page}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
              />
            </Pagination>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
}
