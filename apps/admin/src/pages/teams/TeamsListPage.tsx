import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, Modal, Badge } from 'react-bootstrap';

import { useTeams, useCreateTeam, useDeleteTeam } from '@/features/teams/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { formatDateTime } from '@archetypes/shared';

export function TeamsListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading, error, refetch } = useTeams({ pageSize: 50 });
  const createMutation = useCreateTeam();
  const deleteMutation = useDeleteTeam();

  const handleCreate = () => {
    createMutation.mutate(
      { name, description: description || undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setName('');
          setDescription('');
        },
      }
    );
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message="Не удалось загрузить команды" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Команды</h4>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          Создать команду
        </Button>
      </div>

      <Card>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Игроков</th>
                <th>Создана</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((team) => (
                <tr key={team.id}>
                  <td>
                    <Link to={`/teams/${team.id}`} className="text-decoration-none fw-bold">
                      {team.name}
                    </Link>
                  </td>
                  <td>
                    <span className="text-muted">
                      {team.description || '-'}
                    </span>
                  </td>
                  <td>
                    <Badge bg="info">{team.playersCount}</Badge>
                  </td>
                  <td>{formatDateTime(team.createdAt)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link to={`/teams/${team.id}`}>
                        <Button variant="outline-primary" size="sm">
                          Открыть
                        </Button>
                      </Link>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setDeleteId(team.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Команды не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Create Modal */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Создать команду</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Название *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Название команды"
              value={name}
              onChange={(e) => setName(e.target.value)}
              isInvalid={name.length > 0 && name.length < 1}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Описание</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Описание команды (опционально)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={createMutation.isPending || !name.trim()}
          >
            {createMutation.isPending ? 'Создание...' : 'Создать'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        show={!!deleteId}
        title="Удалить команду"
        message="Вы уверены, что хотите удалить эту команду? Все связанные отчёты также будут удалены."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
