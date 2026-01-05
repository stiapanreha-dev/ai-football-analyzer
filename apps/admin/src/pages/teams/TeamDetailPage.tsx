import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Table, Button, Modal, Form, Spinner, ListGroup, ProgressBar } from 'react-bootstrap';
import { FaCheck, FaTimes, FaPlus, FaTrash, FaChartBar, FaChartLine, FaBroadcastTower, FaFlask } from 'react-icons/fa';

import { useTeam, useAddPlayersToTeam, useRemovePlayersFromTeam, useGenerateTeamReport, useTeamReports, useTeamWaves, useCreateTeamWave, useSimulateTeamReport } from '@/features/teams/hooks';
import { usePlayers } from '@/features/players/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { formatDateTime, ARCHETYPES, type ArchetypeCode, type TeamReportDto } from '@archetypes/shared';

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

  // Simulation state
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationPlayerIds, setSimulationPlayerIds] = useState<number[]>([]);
  const [simulationResult, setSimulationResult] = useState<TeamReportDto | null>(null);
  const [showSimulationResult, setShowSimulationResult] = useState(false);

  const { data: team, isLoading, error, refetch } = useTeam(teamId);
  const { data: allPlayers } = usePlayers({ pageSize: 100 });
  const { data: reports } = useTeamReports(teamId);

  const { data: waves } = useTeamWaves(teamId);

  const addPlayersMutation = useAddPlayersToTeam();
  const removePlayerMutation = useRemovePlayersFromTeam();
  const generateReportMutation = useGenerateTeamReport();
  const createWaveMutation = useCreateTeamWave();
  const simulateMutation = useSimulateTeamReport();

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

  const handleCreateWave = () => {
    createWaveMutation.mutate(
      { teamId },
      {
        onSuccess: (wave) => {
          navigate(`/teams/${teamId}/waves/${wave.id}`);
        },
      }
    );
  };

  const handleStartSimulation = () => {
    // Pre-select all players with reports
    const playersWithReportIds = team?.players.filter(p => p.hasReport).map(p => p.id) ?? [];
    setSimulationPlayerIds(playersWithReportIds);
    setSimulationMode(true);
  };

  const handleCancelSimulation = () => {
    setSimulationMode(false);
    setSimulationPlayerIds([]);
  };

  const handleRunSimulation = () => {
    simulateMutation.mutate(
      { teamId, playerIds: simulationPlayerIds },
      {
        onSuccess: (report) => {
          setSimulationResult(report);
          setShowSimulationResult(true);
          setSimulationMode(false);
        },
      }
    );
  };

  const toggleSimulationPlayer = (playerId: number) => {
    if (simulationPlayerIds.includes(playerId)) {
      setSimulationPlayerIds(simulationPlayerIds.filter(id => id !== playerId));
    } else {
      setSimulationPlayerIds([...simulationPlayerIds, playerId]);
    }
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
            variant="primary"
            onClick={handleCreateWave}
            disabled={createWaveMutation.isPending || team.players.length === 0}
          >
            {createWaveMutation.isPending ? (
              <>
                <Spinner size="sm" className="me-2" />
                Создание...
              </>
            ) : (
              <>
                <FaBroadcastTower className="me-2" />
                Новая волна
              </>
            )}
          </Button>
          <Link to={`/teams/${teamId}/dynamics`}>
            <Button variant="outline-info">
              <FaChartLine className="me-2" />
              Динамика
            </Button>
          </Link>
          <Button
            variant="outline-warning"
            onClick={handleStartSimulation}
            disabled={playersWithReports.length < 2}
          >
            <FaFlask className="me-2" />
            Моделирование
          </Button>
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

      {/* Simulation Mode Bar */}
      {simulationMode && (
        <Card className="mb-4 border-warning">
          <Card.Body className="bg-warning bg-opacity-10">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong><FaFlask className="me-2" />Режим моделирования</strong>
                <span className="ms-3">
                  Выбрано игроков: <Badge bg="primary">{simulationPlayerIds.length}</Badge>
                  {simulationPlayerIds.length < 2 && (
                    <span className="text-danger ms-2">(минимум 2)</span>
                  )}
                </span>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="warning"
                  onClick={handleRunSimulation}
                  disabled={simulateMutation.isPending || simulationPlayerIds.length < 2}
                >
                  {simulateMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Генерация...
                    </>
                  ) : (
                    'Запустить моделирование'
                  )}
                </Button>
                <Button variant="outline-secondary" onClick={handleCancelSimulation}>
                  Отмена
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
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
                    {simulationMode && <th style={{ width: '40px' }}></th>}
                    <th>Имя</th>
                    <th>Позиция</th>
                    <th>Номер</th>
                    <th>Отчёт</th>
                    <th>Доминант. архетип</th>
                    {!simulationMode && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {team.players.map((player) => (
                    <tr
                      key={player.id}
                      className={simulationMode && simulationPlayerIds.includes(player.id) ? 'table-warning' : ''}
                      style={simulationMode ? { cursor: player.hasReport ? 'pointer' : 'not-allowed' } : undefined}
                      onClick={simulationMode && player.hasReport ? () => toggleSimulationPlayer(player.id) : undefined}
                    >
                      {simulationMode && (
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={simulationPlayerIds.includes(player.id)}
                            onChange={() => toggleSimulationPlayer(player.id)}
                            disabled={!player.hasReport}
                          />
                        </td>
                      )}
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
                      {!simulationMode && (
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setRemovePlayerId(player.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!team.players.length && (
                    <tr>
                      <td colSpan={simulationMode ? 6 : 7} className="text-center text-muted py-4">
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
          <Card className="mb-3">
            <Card.Header>
              <strong>Волны тестирования</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {waves?.map((wave) => {
                const statusBadge = {
                  draft: { bg: 'secondary', label: 'Черновик' },
                  active: { bg: 'primary', label: 'Активна' },
                  completed: { bg: 'success', label: 'Завершена' },
                  cancelled: { bg: 'danger', label: 'Отменена' },
                }[wave.status] ?? { bg: 'secondary', label: wave.status };

                return (
                  <ListGroup.Item
                    key={wave.id}
                    action
                    as={Link}
                    to={`/teams/${teamId}/waves/${wave.id}`}
                  >
                    <div className="d-flex justify-content-between">
                      <span>{wave.name ?? `Волна #${wave.id}`}</span>
                      <Badge bg={statusBadge.bg}>{statusBadge.label}</Badge>
                    </div>
                    <small className="text-muted">
                      {wave.completedCount}/{wave.participantsCount} прошли
                    </small>
                  </ListGroup.Item>
                );
              })}
              {!waves?.length && (
                <ListGroup.Item className="text-muted text-center">
                  Волны не созданы
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>

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

      {/* Simulation Result Modal */}
      <Modal
        show={showSimulationResult}
        onHide={() => setShowSimulationResult(false)}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton className="bg-warning bg-opacity-25">
          <Modal.Title>
            <FaFlask className="me-2" />
            Результат моделирования
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {simulationResult && (
            <div>
              <div className="alert alert-warning mb-4">
                <strong>Это моделирование!</strong> Отчёт сгенерирован для {simulationResult.analyzedPlayersCount} выбранных игроков
                и не сохранён в базе данных.
              </div>

              <Row>
                <Col md={4}>
                  <Card className="mb-4">
                    <Card.Header>
                      <strong>Профиль команды</strong>
                    </Card.Header>
                    <Card.Body>
                      {[...simulationResult.teamProfile]
                        .sort((a, b) => b.averageScore - a.averageScore)
                        .map((item) => {
                          const variant = item.averageScore >= 7 ? 'success' : item.averageScore >= 4 ? 'warning' : 'secondary';
                          return (
                            <div key={item.archetypeCode} className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <span>{item.archetypeName}</span>
                                <Badge bg={variant}>{item.averageScore.toFixed(1)}</Badge>
                              </div>
                              <ProgressBar
                                now={item.averageScore * 10}
                                variant={variant}
                                style={{ height: '6px' }}
                              />
                            </div>
                          );
                        })}
                    </Card.Body>
                  </Card>

                  <Card className="mb-4">
                    <Card.Header className="bg-success text-white">
                      <strong>Доминирующие</strong>
                    </Card.Header>
                    <ListGroup variant="flush">
                      {simulationResult.dominantArchetypes.map((code) => (
                        <ListGroup.Item key={code}>
                          {ARCHETYPES[code]?.name ?? code}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>

                  <Card>
                    <Card.Header className="bg-warning">
                      <strong>Слабые</strong>
                    </Card.Header>
                    <ListGroup variant="flush">
                      {simulationResult.weakArchetypes.map((code) => (
                        <ListGroup.Item key={code}>
                          {ARCHETYPES[code]?.name ?? code}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>
                </Col>

                <Col md={8}>
                  <Card className="mb-4">
                    <Card.Header>
                      <strong>Общая оценка</strong>
                    </Card.Header>
                    <Card.Body>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{simulationResult.overallAssessment}</p>
                    </Card.Body>
                  </Card>

                  <h5 className="mb-3">Тактические модели</h5>
                  {simulationResult.recommendations.slice(0, 3).map((rec, index) => (
                    <Card key={rec.style} className="mb-3">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <strong>#{index + 1} {rec.styleName}</strong>
                        <Badge bg={rec.suitability >= 70 ? 'success' : rec.suitability >= 40 ? 'warning' : 'secondary'}>
                          {rec.suitability}%
                        </Badge>
                      </Card.Header>
                      <Card.Body>
                        <p className="mb-2">{rec.reasoning}</p>
                        <Row>
                          <Col md={6}>
                            <h6 className="text-success small">Плюсы</h6>
                            <ul className="small mb-0">
                              {rec.pros.slice(0, 3).map((pro, i) => <li key={i}>{pro}</li>)}
                            </ul>
                          </Col>
                          <Col md={6}>
                            <h6 className="text-danger small">Минусы</h6>
                            <ul className="small mb-0">
                              {rec.cons.slice(0, 3).map((con, i) => <li key={i}>{con}</li>)}
                            </ul>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSimulationResult(false)}>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
