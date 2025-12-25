import { useState } from 'react';
import { Card, Table, Badge, Form, InputGroup, Pagination } from 'react-bootstrap';

import { usePlayers } from '@/features/players/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDate, formatPosition } from '@archetypes/shared';

export function PlayersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');

  const { data, isLoading, error, refetch } = usePlayers({
    page,
    pageSize: 20,
    search: search || undefined,
    position: position || undefined,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message="Не удалось загрузить игроков" onRetry={refetch} />;
  }

  return (
    <div>
      <h4 className="mb-4">Игроки</h4>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex gap-3">
            <InputGroup style={{ maxWidth: '300px' }}>
              <Form.Control
                placeholder="Поиск по имени..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </InputGroup>
            <Form.Select
              style={{ maxWidth: '200px' }}
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Все позиции</option>
              <option value="goalkeeper">Вратарь</option>
              <option value="defender">Защитник</option>
              <option value="midfielder">Полузащитник</option>
              <option value="forward">Нападающий</option>
              <option value="staff">Тренерский штаб</option>
            </Form.Select>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Позиция</th>
                <th>Номер</th>
                <th>Сессий</th>
                <th>Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((player) => (
                <tr key={player.id}>
                  <td>{player.id}</td>
                  <td>{player.name ?? <span className="text-muted">Не указано</span>}</td>
                  <td>
                    {player.position ? (
                      <Badge bg="secondary">{formatPosition(player.position)}</Badge>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>{player.jerseyNumber ?? '-'}</td>
                  <td>
                    <Badge bg="info">{player.completedSessionsCount}</Badge>
                    <span className="text-muted small"> / {player.sessionsCount}</span>
                  </td>
                  <td>{formatDate(player.createdAt)}</td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Игроки не найдены
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
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
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
