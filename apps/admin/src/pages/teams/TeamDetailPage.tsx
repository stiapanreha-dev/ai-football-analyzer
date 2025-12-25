import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Table, Button, Modal, Form, Spinner, ListGroup } from 'react-bootstrap';
import { FaCheck, FaTimes, FaPlus, FaTrash, FaChartBar } from 'react-icons/fa';

import { useTeam, useAddPlayersToTeam, useRemovePlayersFromTeam, useGenerateTeamReport, useTeamReports } from '@/features/teams/hooks';
import { usePlayers } from '@/features/players/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { formatDateTime, ARCHETYPES, type ArchetypeCode } from '@archetypes/shared';

const positionLabels: Record<string, string> = {
  goalkeeper: 'Вратарь',
  defender: 'Защитник',
  midfielder: 'Полузащитник',
  forward: 'Нападающий',
  staff: 'Тренерский штаб',
};

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamId = Number(id);

  const [showAddPlayers, setShowAddPlayers] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [removePlayerId, setRemovePlayerId] = useState<number | null>(null);

  const { data: team, isLoading, error, refetch } = useTeam(teamId);
  const { data: allPlayers } = usePlayers({ pageSize: 100 });
  const { data: reports } = useTeamReports(teamId);

  const addPlayersMutation = useAddPlayersToTeam();
  const removePlayerMutation = useRemovePlayersFromTeam();
  const generateReportMutation = useGenerateTeamReport();

  const handleAddPlayers = () => {
    if (selectedPlayerIds.length > 0) {
      addPlayersMutation.mutate(
        { teamId, playerIds: selectedPlayerIds },
        {
          onSuccess: () => {
            setShowAddPlayers(false);
            setSelectedPlayerIds([]);
          },
        }
      );
    }
  };

  const handleRemovePlayer = () => {
    if (removePlayerId) {
      removePlayerMutation.mutate(
        { teamId, playerIds: [removePlayerId] },
        {
          onSuccess: () => setRemovePlayerId(null),
        }
      );
    }
  };

  const handleGenerateReport = () => {
    generateReportMutation.mutate(teamId, {
      onSuccess: (report) => {
        navigate(`/teams/${teamId}/reports/${report.id}`);
      },
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !team) {
    return <ErrorAlert message="Не удалось загрузить команду" onRetry={refetch} />;
  }

  // Filter out players already in the team
  const teamPlayerIds = new Set(team.players.map(p => p.id));
  const availablePlayers = allPlayers?.items.filter(p => !teamPlayerIds.has(p.id)) ?? [];
  const playersWithReports = team.players.filter(p => p.hasReport);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">{team.name}</h4>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            onClick={handleGenerateReport}
            disabled={generateReportMutation.isPending || playersWithReports.length < 2}
          >
            {generateReportMutation.isPending ? (
              <>
                <Spinner size="sm" className="me-2" />
                Генерация...
              </>
            ) : (
              <>
                <FaChartBar className="me-2" />
                Сгенерировать отчёт
              </>
            )}
          </Button>
          <Link to="/teams">
            <Button variant="outline-secondary">Назад к списку</Button>
          </Link>
        </div>
      </div>

      {team.description && (
        <p className="text-muted mb-4">{team.description}</p>
      )}

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Игроки ({team.players.length})</strong>
              <Button variant="primary" size="sm" onClick={() => setShowAddPlayers(true)}>
                <FaPlus className="me-1" /> Добавить
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Имя</th>
                    <th>Позиция</th>
                    <th>Номер</th>
                    <th>Отчёт</th>
                    <th>Доминант. архетип</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {team.players.map((player) => (
                    <tr key={player.id}>
                      <td>{player.name ?? `Игрок #${player.id}`}</td>
                      <td>
                        {player.position ? (
                          <Badge bg="info">
                            {positionLabels[player.position] ?? player.position}
                          </Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{player.jerseyNumber ?? '-'}</td>
                      <td>
                        {player.hasReport ? (
                          <Badge bg="success"><FaCheck className="me-1" /> Есть</Badge>
                        ) : (
                          <Badge bg="secondary"><FaTimes className="me-1" /> Нет</Badge>
                        )}
                      </td>
                      <td>
                        {player.dominantArchetype ? (
                          <Badge bg="primary">
                            {ARCHETYPES[player.dominantArchetype as ArchetypeCode]?.name ?? player.dominantArchetype}
                          </Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setRemovePlayerId(player.id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!team.players.length && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        Игроки не добавлены
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {playersWithReports.length < 2 && (
            <div className="alert alert-warning">
              Для генерации тактического отчёта нужно минимум 2 игрока с пройденным тестированием.
              Сейчас: {playersWithReports.length} из {team.players.length}
            </div>
          )}
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <strong>Тактические отчёты</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {reports?.map((report) => (
                <ListGroup.Item
                  key={report.id}
                  action
                  as={Link}
                  to={`/teams/${teamId}/reports/${report.id}`}
                >
                  <div className="d-flex justify-content-between">
                    <span>Отчёт #{report.id}</span>
                    <Badge bg="info">{report.analyzedPlayersCount} игр.</Badge>
                  </div>
                  <small className="text-muted">{formatDateTime(report.createdAt)}</small>
                </ListGroup.Item>
              ))}
              {!reports?.length && (
                <ListGroup.Item className="text-muted text-center">
                  Отчёты не сгенерированы
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {/* Add Players Modal */}
      <Modal show={showAddPlayers} onHide={() => setShowAddPlayers(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Добавить игроков</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availablePlayers.length === 0 ? (
            <p className="text-muted text-center">Все игроки уже добавлены в команду</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {availablePlayers.map((player) => (
                <Form.Check
                  key={player.id}
                  type="checkbox"
                  id={`player-${player.id}`}
                  label={
                    <span>
                      {player.name ?? `Игрок #${player.id}`}
                      {player.position && (
                        <Badge bg="info" className="ms-2">
                          {positionLabels[player.position] ?? player.position}
                        </Badge>
                      )}
                    </span>
                  }
                  checked={selectedPlayerIds.includes(player.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlayerIds([...selectedPlayerIds, player.id]);
                    } else {
                      setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== player.id));
                    }
                  }}
                  className="mb-2"
                />
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddPlayers(false)}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleAddPlayers}
            disabled={addPlayersMutation.isPending || selectedPlayerIds.length === 0}
          >
            {addPlayersMutation.isPending ? 'Добавление...' : `Добавить (${selectedPlayerIds.length})`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Remove Player Confirm Modal */}
      <ConfirmModal
        show={!!removePlayerId}
        title="Удалить игрока из команды"
        message="Вы уверены, что хотите удалить этого игрока из команды?"
        confirmLabel="Удалить"
        onConfirm={handleRemovePlayer}
        onCancel={() => setRemovePlayerId(null)}
      />
    </div>
  );
}
