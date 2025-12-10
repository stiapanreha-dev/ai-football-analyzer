import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Badge, ListGroup, Button, ProgressBar } from 'react-bootstrap';

import { useReport } from '@/features/reports/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime } from '@archetypes/shared';

const strengthLabels: Record<string, { label: string; variant: string }> = {
  dominant: { label: 'Доминирующий', variant: 'success' },
  moderate: { label: 'Умеренный', variant: 'primary' },
  weak: { label: 'Слабый', variant: 'warning' },
  absent: { label: 'Отсутствует', variant: 'secondary' },
};

const positionLabels: Record<string, string> = {
  goalkeeper: 'Вратарь',
  defender: 'Защитник',
  midfielder: 'Полузащитник',
  forward: 'Нападающий',
};

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);

  const { data: report, isLoading, error, refetch } = useReport(reportId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !report) {
    return <ErrorAlert message="Не удалось загрузить отчёт" onRetry={refetch} />;
  }

  const sortedScores = [...report.scores].sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          Отчёт #{report.id}
        </h4>
        <Link to="/reports">
          <Button variant="outline-secondary">Назад к списку</Button>
        </Link>
      </div>

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <strong>Игрок</strong>
            </Card.Header>
            <Card.Body>
              <h5>{report.player.name ?? `Игрок #${report.player.id}`}</h5>
              {report.player.position && (
                <p className="mb-1">
                  <Badge bg="info">
                    {positionLabels[report.player.position] ?? report.player.position}
                  </Badge>
                </p>
              )}
              {report.player.jerseyNumber && (
                <p className="mb-1 text-muted">
                  Номер: #{report.player.jerseyNumber}
                </p>
              )}
              <p className="mb-0 text-muted small">
                Создан: {formatDateTime(report.createdAt)}
              </p>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <strong>Профиль архетипов</strong>
            </Card.Header>
            <Card.Body>
              {sortedScores.map((score) => {
                const strengthInfo = strengthLabels[score.strength] ?? {
                  label: score.strength,
                  variant: 'secondary',
                };
                return (
                  <div key={score.archetypeCode} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{score.archetypeName}</span>
                      <Badge bg={strengthInfo.variant}>
                        {score.finalScore.toFixed(1)}
                      </Badge>
                    </div>
                    <ProgressBar
                      now={score.finalScore * 10}
                      variant={strengthInfo.variant}
                      style={{ height: '8px' }}
                    />
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <strong>Характеристика для игрока</strong>
            </Card.Header>
            <Card.Body>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {report.playerSummary}
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <strong>Резюме для тренера</strong>
            </Card.Header>
            <Card.Body>
              <p>{report.coachReport.summary}</p>
            </Card.Body>
          </Card>

          <Row>
            <Col md={6}>
              <Card className="mb-4 border-success">
                <Card.Header className="bg-success text-white">
                  <strong>Сильные стороны</strong>
                </Card.Header>
                <ListGroup variant="flush">
                  {report.coachReport.strengths.map((item, i) => (
                    <ListGroup.Item key={i}>
                      <span className="text-success me-2">✓</span>
                      {item}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-4 border-warning">
                <Card.Header className="bg-warning">
                  <strong>Слабые стороны</strong>
                </Card.Header>
                <ListGroup variant="flush">
                  {report.coachReport.weaknesses.map((item, i) => (
                    <ListGroup.Item key={i}>
                      <span className="text-warning me-2">!</span>
                      {item}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="mb-4 border-primary">
                <Card.Header className="bg-primary text-white">
                  <strong>Эффективен в ситуациях</strong>
                </Card.Header>
                <ListGroup variant="flush">
                  {report.coachReport.bestSituations.map((item, i) => (
                    <ListGroup.Item key={i}>
                      <span className="text-primary me-2">★</span>
                      {item}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-4 border-danger">
                <Card.Header className="bg-danger text-white">
                  <strong>Ситуации риска</strong>
                </Card.Header>
                <ListGroup variant="flush">
                  {report.coachReport.riskSituations.map((item, i) => (
                    <ListGroup.Item key={i}>
                      <span className="text-danger me-2">⚠</span>
                      {item}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>
          </Row>

          <Card className="mb-4">
            <Card.Header>
              <strong>Совместимость</strong>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-success">Хорошо взаимодействует с:</h6>
                  <ul>
                    {report.coachReport.compatibility.worksWith.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </Col>
                <Col md={6}>
                  <h6 className="text-danger">Возможны конфликты с:</h6>
                  <ul>
                    {report.coachReport.compatibility.conflictsWith.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4 border-info">
            <Card.Header className="bg-info text-white">
              <strong>Рекомендации тренеру</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {report.coachReport.recommendations.map((item, i) => (
                <ListGroup.Item key={i}>
                  <span className="text-info me-2">{i + 1}.</span>
                  {item}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
