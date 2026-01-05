import { useState } from 'react';
import { Card, Table, Badge, Form, InputGroup, Pagination, Button, Modal, Spinner } from 'react-bootstrap';
import { FaTrash, FaEdit } from 'react-icons/fa';

import { usePlayers, useDeletePlayer, useUpdatePlayer } from '@/features/players/hooks';
import type { UpdatePlayerParams } from '@/features/players/api';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { formatDate, formatPosition, type PlayerWithStatsDto } from '@archetypes/shared';

type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'staff';

export function PlayersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editPlayer, setEditPlayer] = useState<PlayerWithStatsDto | null>(null);
  const [editForm, setEditForm] = useState<UpdatePlayerParams>({});

  const { data, isLoading, error, refetch } = usePlayers({
    page,
    pageSize: 20,
    search: search || undefined,
    position: position || undefined,
  });

  const deleteMutation = useDeletePlayer();
  const updateMutation = useUpdatePlayer();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleEditOpen = (player: PlayerWithStatsDto) => {
    setEditPlayer(player);
    setEditForm({
      name: player.name ?? '',
      position: player.position ?? undefined,
      jerseyNumber: player.jerseyNumber ?? undefined,
    });
  };

  const handleEditClose = () => {
    setEditPlayer(null);
    setEditForm({});
  };

  const handleEditSave = () => {
    if (editPlayer) {
      updateMutation.mutate(
        { id: editPlayer.id, data: editForm },
        { onSuccess: handleEditClose }
      );
    }
  };

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
                <th></th>
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
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-1"
                      onClick={() => handleEditOpen(player)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setDeleteId(player.id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
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

      <ConfirmModal
        show={!!deleteId}
        title="Удалить игрока"
        message="Вы уверены, что хотите удалить этого игрока? Все его сессии и отчёты также будут удалены."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <Modal show={!!editPlayer} onHide={handleEditClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Редактировать игрока</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Имя</Form.Label>
              <Form.Control
                type="text"
                value={editForm.name ?? ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Введите имя игрока"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Позиция</Form.Label>
              <Form.Select
                value={editForm.position ?? ''}
                onChange={(e) => setEditForm({
                  ...editForm,
                  position: e.target.value ? e.target.value as PlayerPosition : undefined,
                })}
              >
                <option value="">Не указана</option>
                <option value="goalkeeper">Вратарь</option>
                <option value="defender">Защитник</option>
                <option value="midfielder">Полузащитник</option>
                <option value="forward">Нападающий</option>
                <option value="staff">Тренерский штаб</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Номер на футболке</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={99}
                value={editForm.jerseyNumber ?? ''}
                onChange={(e) => setEditForm({
                  ...editForm,
                  jerseyNumber: e.target.value ? Number(e.target.value) : undefined,
                })}
                placeholder="1-99"
              />
            </Form.Group>

            {editPlayer && (
              <div className="text-muted small">
                <div>Telegram ID: {editPlayer.telegramId}</div>
                <div>Дата регистрации: {formatDate(editPlayer.createdAt)}</div>
                <div>Сессий: {editPlayer.completedSessionsCount} / {editPlayer.sessionsCount}</div>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleEditClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleEditSave}
            disabled={updateMutation.isPending}
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
        </Modal.Footer>
      </Modal>
    </div>
  );
}
