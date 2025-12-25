import { useState } from 'react';
import { Card, Table, Badge, Button, Form, Modal, Row, Col } from 'react-bootstrap';
import type { CreatePinInput, PinType } from '@archetypes/shared';

import { usePins, useCreatePin, useRevokePin } from '@/features/pins/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { formatDateTime, formatPinCode } from '@archetypes/shared';

const typeLabels: Record<string, { label: string; variant: string }> = {
  single: { label: 'Одноразовый', variant: 'info' },
  multi: { label: 'Многоразовый', variant: 'primary' },
  session: { label: 'Сессионный', variant: 'warning' },
  personal: { label: 'Именной', variant: 'success' },
};

const positionLabels: Record<string, string> = {
  goalkeeper: 'Вратарь',
  defender: 'Защитник',
  midfielder: 'Полузащитник',
  forward: 'Нападающий',
  staff: 'Тренерский штаб',
};

export function PinsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [type, setType] = useState<PinType>('single');
  const [maxUses, setMaxUses] = useState(5);
  const [expiresInHours, setExpiresInHours] = useState(24);
  // Поля для именного PIN
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState<'goalkeeper' | 'defender' | 'midfielder' | 'forward'>('midfielder');
  const [playerJerseyNumber, setPlayerJerseyNumber] = useState<number | ''>('');

  const { data, isLoading, error, refetch } = usePins({ pageSize: 50 });
  const createMutation = useCreatePin();
  const revokeMutation = useRevokePin();

  const handleCreate = () => {
    const pinData: CreatePinInput = { type };
    if (type === 'multi') {
      pinData.maxUses = maxUses;
    }
    if (type === 'session') {
      pinData.expiresInHours = expiresInHours;
    }
    if (type === 'personal') {
      pinData.playerName = playerName;
      pinData.playerPosition = playerPosition;
      if (playerJerseyNumber !== '') {
        pinData.playerJerseyNumber = playerJerseyNumber;
      }
    }

    createMutation.mutate(pinData, {
      onSuccess: () => {
        setShowCreate(false);
        setType('single');
        setMaxUses(5);
        setExpiresInHours(24);
        setPlayerName('');
        setPlayerPosition('midfielder');
        setPlayerJerseyNumber('');
      },
    });
  };

  const isPersonalValid = type !== 'personal' || (playerName.length >= 2 && playerPosition);

  const handleRevoke = () => {
    if (revokeId) {
      revokeMutation.mutate(revokeId, {
        onSuccess: () => setRevokeId(null),
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message="Не удалось загрузить PIN-коды" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">PIN-коды</h4>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          Создать PIN
        </Button>
      </div>

      <Card>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Код</th>
                <th>Тип</th>
                <th>Использований</th>
                <th>Статус</th>
                <th>Создан</th>
                <th>Истекает</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((pin) => {
                const typeInfo = typeLabels[pin.type] ?? { label: pin.type, variant: 'secondary' };
                const isExpired = pin.expiresAt && new Date(pin.expiresAt) < new Date();
                const isExhausted = pin.currentUses >= pin.maxUses;

                return (
                  <tr key={pin.id} className={!pin.isActive ? 'table-secondary' : ''}>
                    <td>
                      <code className="fs-6">{formatPinCode(pin.code)}</code>
                    </td>
                    <td>
                      <Badge bg={typeInfo.variant}>{typeInfo.label}</Badge>
                      {pin.type === 'personal' && pin.playerName && (
                        <div className="small text-muted mt-1">
                          {pin.playerName}
                          {pin.playerPosition && ` (${positionLabels[pin.playerPosition]})`}
                          {pin.playerJerseyNumber && ` #${pin.playerJerseyNumber}`}
                        </div>
                      )}
                    </td>
                    <td>
                      {pin.currentUses} / {pin.maxUses}
                    </td>
                    <td>
                      {!pin.isActive ? (
                        <Badge bg="secondary">Отозван</Badge>
                      ) : isExpired ? (
                        <Badge bg="danger">Истёк</Badge>
                      ) : isExhausted ? (
                        <Badge bg="warning">Исчерпан</Badge>
                      ) : (
                        <Badge bg="success">Активен</Badge>
                      )}
                    </td>
                    <td>{formatDateTime(pin.createdAt)}</td>
                    <td>
                      {pin.expiresAt ? formatDateTime(pin.expiresAt) : <span className="text-muted">-</span>}
                    </td>
                    <td>
                      {pin.isActive && !isExpired && !isExhausted && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setRevokeId(pin.id)}
                        >
                          Отозвать
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!data?.items.length && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    PIN-коды не найдены
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
          <Modal.Title>Создать PIN-код</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Тип PIN-кода</Form.Label>
            <Form.Select
              value={type}
              onChange={(e) => setType(e.target.value as PinType)}
            >
              <option value="single">Одноразовый (1 использование)</option>
              <option value="multi">Многоразовый (N использований)</option>
              <option value="session">Сессионный (ограничен по времени)</option>
              <option value="personal">Именной (с данными игрока)</option>
            </Form.Select>
          </Form.Group>

          {type === 'multi' && (
            <Form.Group className="mb-3">
              <Form.Label>Максимум использований</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={1000}
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
              />
            </Form.Group>
          )}

          {type === 'session' && (
            <Form.Group className="mb-3">
              <Form.Label>Срок действия (часы)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={720}
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
              />
            </Form.Group>
          )}

          {type === 'personal' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>ФИО игрока *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  isInvalid={playerName.length > 0 && playerName.length < 2}
                />
                <Form.Control.Feedback type="invalid">
                  Минимум 2 символа
                </Form.Control.Feedback>
              </Form.Group>

              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Позиция *</Form.Label>
                    <Form.Select
                      value={playerPosition}
                      onChange={(e) => setPlayerPosition(e.target.value as typeof playerPosition)}
                    >
                      <option value="goalkeeper">Вратарь</option>
                      <option value="defender">Защитник</option>
                      <option value="midfielder">Полузащитник</option>
                      <option value="forward">Нападающий</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Номер</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      max={99}
                      placeholder="10"
                      value={playerJerseyNumber}
                      onChange={(e) => setPlayerJerseyNumber(e.target.value ? Number(e.target.value) : '')}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={createMutation.isPending || !isPersonalValid}
          >
            {createMutation.isPending ? 'Создание...' : 'Создать'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Revoke Confirm Modal */}
      <ConfirmModal
        show={!!revokeId}
        title="Отозвать PIN-код"
        message="Вы уверены, что хотите отозвать этот PIN-код? Он больше не сможет быть использован."
        confirmLabel="Отозвать"
        onConfirm={handleRevoke}
        onCancel={() => setRevokeId(null)}
      />
    </div>
  );
}
