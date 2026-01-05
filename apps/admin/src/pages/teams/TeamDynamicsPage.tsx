import { useParams, Link } from 'react-router-dom';
import { Card, Table, Badge, Button, Row, Col, Accordion } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaMinus, FaStar, FaArrowLeft, FaChartLine } from 'react-icons/fa';

import { useTeamDynamics, useTeam } from '@/features/teams/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime, ARCHETYPES, type ArchetypeCode, type ArchetypeChangeDto } from '@archetypes/shared';

function TrendIcon({ trend }: { trend: ArchetypeChangeDto['trend'] }) {
  switch (trend) {
    case 'up':
      return <FaArrowUp className="text-success" />;
    case 'down':
      return <FaArrowDown className="text-danger" />;
    case 'stable':
      return <FaMinus className="text-secondary" />;
    case 'new':
      return <FaStar className="text-warning" />;
    default:
      return null;
  }
}

function formatDelta(delta: number | null): string {
  if (delta === null) return '-';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}`;
}

function ArchetypeChangesTable({ changes }: { changes: ArchetypeChangeDto[] }) {
  return (
    <Table hover responsive className="mb-0">
      <thead className="bg-light">
        <tr>
          <th>Архетип</th>
          <th>Было</th>
          <th>Стало</th>
          <th>Изменение</th>
          <th>Тренд</th>
        </tr>
      </thead>
      <tbody>
        {changes.map((change) => {
          const archetype = ARCHETYPES[change.archetypeCode as ArchetypeCode];
          return (
            <tr key={change.archetypeCode}>
              <td>
                <span
                  className="d-inline-block rounded-circle me-2"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: archetype?.color ?? '#ccc',
                  }}
                />
                {change.archetypeName}
              </td>
              <td>
                {change.previousScore !== null ? change.previousScore.toFixed(1) : '-'}
              </td>
              <td>
                <strong>{change.currentScore.toFixed(1)}</strong>
              </td>
              <td>
                <Badge
                  bg={
                    change.delta === null
                      ? 'secondary'
                      : change.delta > 0
                        ? 'success'
                        : change.delta < 0
                          ? 'danger'
                          : 'secondary'
                  }
                >
                  {formatDelta(change.delta)}
                </Badge>
              </td>
              <td>
                <TrendIcon trend={change.trend} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export function TeamDynamicsPage() {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);

  const { data: team } = useTeam(teamId);
  const { data: dynamics, isLoading, error, refetch } = useTeamDynamics(teamId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    const errorMessage = error instanceof Error && error.message.includes('404')
      ? 'Нет данных для анализа динамики. Необходимо минимум 1 завершённая волна тестирования.'
      : 'Не удалось загрузить динамику команды';
    return (
      <div>
        <div className="d-flex align-items-center gap-3 mb-4">
          <Link to={`/teams/${teamId}`} className="text-decoration-none">
            <Button variant="outline-secondary" size="sm">
              <FaArrowLeft />
            </Button>
          </Link>
          <h4 className="mb-0">Динамика команды</h4>
        </div>
        <ErrorAlert message={errorMessage} onRetry={refetch} />
      </div>
    );
  }

  if (!dynamics) {
    return null;
  }

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
            <h4 className="mb-0">
              <FaChartLine className="me-2" />
              Динамика: {team?.name ?? dynamics.teamName}
            </h4>
          </div>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <div className="text-muted mb-1">Текущая волна</div>
              <div className="h5 mb-0">
                Волна #{dynamics.currentWave.id}
                <small className="text-muted ms-2">
                  {formatDateTime(dynamics.currentWave.date)}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <div className="text-muted mb-1">Предыдущая волна</div>
              <div className="h5 mb-0">
                {dynamics.previousWave ? (
                  <>
                    Волна #{dynamics.previousWave.id}
                    <small className="text-muted ms-2">
                      {formatDateTime(dynamics.previousWave.date)}
                    </small>
                  </>
                ) : (
                  <span className="text-muted">Нет данных</span>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <strong>Изменения профиля команды</strong>
        </Card.Header>
        <Card.Body className="p-0">
          <ArchetypeChangesTable changes={dynamics.profileChanges} />
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <strong>Изменения по игрокам ({dynamics.playerChanges.length})</strong>
        </Card.Header>
        <Card.Body className="p-0">
          <Accordion flush>
            {dynamics.playerChanges.map((player, idx) => (
              <Accordion.Item key={player.playerId} eventKey={String(idx)}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <span>{player.playerName}</span>
                    <div>
                      {player.previousSession ? (
                        <Badge bg="info" className="me-2">
                          Сравнение с {formatDateTime(player.previousSession.date).split(',')[0]}
                        </Badge>
                      ) : (
                        <Badge bg="secondary" className="me-2">Первый тест</Badge>
                      )}
                    </div>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="p-0">
                  <ArchetypeChangesTable changes={player.changes} />
                </Accordion.Body>
              </Accordion.Item>
            ))}
            {dynamics.playerChanges.length === 0 && (
              <div className="text-center text-muted py-4">
                Нет данных по игрокам
              </div>
            )}
          </Accordion>
        </Card.Body>
      </Card>
    </div>
  );
}
