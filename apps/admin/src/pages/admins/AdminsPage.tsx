import { useState } from 'react';
import {
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
  Spinner,
} from 'react-bootstrap';

import { useAuth } from '@/shared/lib/useAuth';
import { useAdmins, useCreateAdmin, useDeleteAdmin } from '@/features/admins/hooks';
import type { AdminRole } from '@/features/admins/api';

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
};

export function AdminsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [newTelegramId, setNewTelegramId] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('user');

  const currentAdmin = useAuth((state) => state.admin);
  const { data, isLoading, error } = useAdmins();
  const createMutation = useCreateAdmin();
  const deleteMutation = useDeleteAdmin();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTelegramId.trim()) return;

    try {
      await createMutation.mutateAsync({ telegramId: newTelegramId.trim(), role: newRole });
      setShowAddModal(false);
      setNewTelegramId('');
      setNewRole('user');
    } catch {
      // Error will be shown via mutation state
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setShowDeleteModal(null);
    } catch {
      // Error will be shown via mutation state
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ru-RU');
  };

  const getDisplayName = (admin: { firstName: string | null; lastName: string | null; username: string | null }) => {
    if (admin.firstName || admin.lastName) {
      return [admin.firstName, admin.lastName].filter(Boolean).join(' ');
    }
    if (admin.username) return `@${admin.username}`;
    return '-';
  };

  if (isLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">Ошибка загрузки списка администраторов</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Пользователи</h1>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          Добавить пользователя
        </Button>
      </div>

      <Card>
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Telegram ID</th>
              <th>Имя</th>
              <th>Username</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Последний вход</th>
              <th>Создан</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.id}</td>
                <td>
                  <code>{admin.telegramId}</code>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {admin.photoUrl && (
                      <img
                        src={admin.photoUrl}
                        alt=""
                        className="rounded-circle"
                        style={{ width: 32, height: 32 }}
                      />
                    )}
                    <span>{getDisplayName(admin)}</span>
                  </div>
                </td>
                <td>{admin.username ? `@${admin.username}` : '-'}</td>
                <td>
                  <Badge bg={admin.role === 'admin' ? 'primary' : 'info'}>
                    {ROLE_LABELS[admin.role]}
                  </Badge>
                </td>
                <td>
                  <Badge bg={admin.isActive ? 'success' : 'secondary'}>
                    {admin.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                </td>
                <td>{formatDate(admin.lastLogin)}</td>
                <td>{formatDate(admin.createdAt)}</td>
                <td>
                  {currentAdmin?.id !== admin.id && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setShowDeleteModal(admin.id)}
                    >
                      Удалить
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted py-4">
                  Нет администраторов
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Add Admin Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить пользователя</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddAdmin}>
          <Modal.Body>
            {createMutation.isError && (
              <Alert variant="danger">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : 'Ошибка при добавлении пользователя'}
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Telegram ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: 123456789"
                value={newTelegramId}
                onChange={(e) => setNewTelegramId(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Telegram ID можно получить у бота @userinfobot или через настройки бота
              </Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label>Роль</Form.Label>
              <Form.Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AdminRole)}
              >
                <option value="user">Пользователь (ограниченный доступ)</option>
                <option value="admin">Администратор (полный доступ)</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Пользователь не имеет доступа к разделам: Администраторы, Аудит лог, Настройки, Промпты
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createMutation.isPending || !newTelegramId.trim()}
            >
              {createMutation.isPending ? 'Добавление...' : 'Добавить'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal !== null} onHide={() => setShowDeleteModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение удаления</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteMutation.isError && (
            <Alert variant="danger">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : 'Ошибка при удалении администратора'}
            </Alert>
          )}
          <p>Вы уверены, что хотите удалить этого администратора?</p>
          <p className="text-muted">Администратор потеряет доступ к панели управления.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(null)}>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={() => showDeleteModal && handleDeleteAdmin(showDeleteModal)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
