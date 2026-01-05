import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Table, Badge, Button, Spinner, ProgressBar, Row, Col } from 'react-bootstrap';
import { FaPlay, FaCheck, FaTimes, FaBell, FaArrowLeft } from 'react-icons/fa';

import { useTeamWave, useStartTeamWave, useCompleteTeamWave, useCancelTeamWave } from '@/features/teams/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { formatDateTime } from '@archetypes/shared';
import { useState } from 'react';

const statusLabels: Record<string, { label: string; variant: string }> = {
  draft: { label: 'Черновик', variant: 'secondary' },
  active: { label: 'Активна', variant: 'primary' },
  completed: { label: 'Завершена', variant: 'success' },
  cancelled: { label: 'Отменена', variant: 'danger' },
};

export function WaveDetailPage() {
  const { id, waveId } = useParams<{ id: string; waveId: string }>();
  const navigate = useNavigate();
  const teamId = Number(id);
  const waveIdNum = Number(waveId);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: wave, isLoading, error, refetch } = useTeamWave(teamId, waveIdNum);
  const startMutation = useStartTeamWave();
  const completeMutation = useCompleteTeamWave();
  const cancelMutation = useCancelTeamWave();

  const handleStart = () => {
    startMutation.mutate({ teamId, waveId: waveIdNum });
  };

  const handleComplete = () => {
    completeMutation.mutate({ teamId, waveId: waveIdNum });
  };

  const handleCancel = () => {
    cancelMutation.mutate(
      { teamId, waveId: waveIdNum },
      {
        onSuccess: () => {
          navigate(`/teams/${teamId}`);
        },
      }
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !wave) {
    return <ErrorAlert message="Не удалось загрузить волну тестирования" onRetry={refetch} />;
  }

  const status = statusLabels[wave.status] ?? { label: wave.status, variant: 'secondary' };
  const completedCount = wave.participations.filter(p => p.completed).length;
  const notifiedCount = wave.participations.filter(p => p.notified).length;
  const progress = wave.participations.length > 0 ? Math.round((completedCount / wave.participations.length) * 100) : 0;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to={`/teams/${teamId}`} className="text-decoration-none">
            <Button variant="outline-secondary" size="sm">
              <FaArrowLeft />
            </Button>
          </Link>
          <div>
            <h4 className="mb-0">{wave.name ?? `Волна #${wave.id}`}</h4>
            <small className="text-muted">Команда ID: {teamId}</small>
          </div>
        </div>
        <Badge bg={status.variant} className="fs-6">{status.label}</Badge>
      </div>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="h3 mb-0">{wave.participations.length}</div>
              <div className="text-muted">Участников</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="h3 mb-0">{notifiedCount}</div>
              <div className="text-muted">Уведомлено</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="h3 mb-0">{completedCount}</div>
              <div className="text-muted">Прошли тест</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="h3 mb-0">{progress}%</div>
              <div className="text-muted">Прогресс</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {wave.status === 'active' && (
        <Card className="mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Прогресс тестирования</span>
              <span>{completedCount} / {wave.participations.length}</span>
            </div>
            <ProgressBar
              now={progress}
              variant={progress === 100 ? 'success' : 'primary'}
              animated={progress < 100}
            />
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <strong>Действия</strong>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2">
            {wave.status === 'draft' && (
              <Button
                variant="success"
                onClick={handleStart}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <FaPlay className="me-2" />
                    Запустить волну
                  </>
                )}
              </Button>
            )}
            {wave.status === 'active' && (
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Завершение...
                  </>
                ) : (
                  <>
                    <FaCheck className="me-2" />
                    Завершить волну
                  </>
                )}
              </Button>
            )}
            {(wave.status === 'draft' || wave.status === 'active') && (
              <Button
                variant="outline-danger"
                onClick={() => setShowCancelConfirm(true)}
              >
                <FaTimes className="me-2" />
                Отменить
              </Button>
            )}
            {wave.teamReportId && (
              <Link to={`/teams/${teamId}/reports/${wave.teamReportId}`}>
                <Button variant="outline-info">
                  Посмотреть отчёт
                </Button>
              </Link>
            )}
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <strong>Участники ({wave.participations.length})</strong>
        </Card.Header>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Игрок</th>
                <th>Уведомлён</th>
                <th>Дата уведомления</th>
                <th>Прошёл тест</th>
                <th>Дата завершения</th>
              </tr>
            </thead>
            <tbody>
              {wave.participations.map((p) => (
                <tr key={p.playerId}>
                  <td>{p.playerName ?? `Игрок #${p.playerId}`}</td>
                  <td>
                    {p.notified ? (
                      <Badge bg="success"><FaBell className="me-1" /> Да</Badge>
                    ) : (
                      <Badge bg="secondary">Нет</Badge>
                    )}
                  </td>
                  <td>
                    {p.notifiedAt ? formatDateTime(p.notifiedAt) : '-'}
                  </td>
                  <td>
                    {p.completed ? (
                      <Badge bg="success"><FaCheck className="me-1" /> Да</Badge>
                    ) : (
                      <Badge bg="warning">Ожидание</Badge>
                    )}
                  </td>
                  <td>
                    {p.completedAt ? formatDateTime(p.completedAt) : '-'}
                  </td>
                </tr>
              ))}
              {wave.participations.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Нет участников
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="mt-3 text-muted small">
        <div>Создано: {formatDateTime(wave.createdAt)}</div>
        {wave.startedAt && <div>Запущено: {formatDateTime(wave.startedAt)}</div>}
        {wave.completedAt && <div>Завершено: {formatDateTime(wave.completedAt)}</div>}
      </div>

      <ConfirmModal
        show={showCancelConfirm}
        title="Отменить волну тестирования"
        message="Вы уверены, что хотите отменить эту волну? Это действие необратимо."
        confirmLabel="Отменить волну"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
