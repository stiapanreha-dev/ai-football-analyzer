import { useParams, Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { Card, Row, Col, Badge, ListGroup, Button, ProgressBar, Spinner } from 'react-bootstrap';
import html2pdf from 'html2pdf.js';
import { FaCrown, FaFistRaised, FaBrain, FaHandshake, FaCog, FaStar, FaDoorOpen } from 'react-icons/fa';

import { useReport } from '@/features/reports/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime, ARCHETYPES, type ArchetypeCode } from '@archetypes/shared';

const archetypeIcons: Record<ArchetypeCode, React.ReactNode> = {
  leader: <FaCrown className="me-2" />,
  warrior: <FaFistRaised className="me-2" />,
  strategist: <FaBrain className="me-2" />,
  diplomat: <FaHandshake className="me-2" />,
  executor: <FaCog className="me-2" />,
  individualist: <FaStar className="me-2" />,
  avoider: <FaDoorOpen className="me-2" />,
};

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
  staff: 'Тренерский штаб',
};

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: report, isLoading, error, refetch } = useReport(reportId);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !report) return;

    setIsGeneratingPdf(true);
    try {
      const playerName = report.player.name ?? `player_${report.player.id}`;
      const filename = `report_${playerName.replace(/\s+/g, '_')}_${report.id}.pdf`;

      const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(reportRef.current).save();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
        <div className="d-flex gap-2">
          <Button
            variant="success"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <Spinner size="sm" className="me-2" />
                Генерация...
              </>
            ) : (
              'Скачать PDF'
            )}
          </Button>
          <Link to="/reports">
            <Button variant="outline-secondary">Назад к списку</Button>
          </Link>
        </div>
      </div>

      <div ref={reportRef}>
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
              <strong>Совместимость с другими архетипами</strong>
            </Card.Header>
            <Card.Body>
              {(Object.keys(ARCHETYPES) as ArchetypeCode[]).map((code) => {
                const archetype = ARCHETYPES[code];
                const percent = report.coachReport.compatibility[code] ?? 0;
                const variant = percent >= 70 ? 'success' : percent >= 40 ? 'warning' : 'danger';
                return (
                  <div key={code} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="d-flex align-items-center">
                        {archetypeIcons[code]}
                        {archetype.name}
                      </span>
                      <Badge bg={variant}>{percent}%</Badge>
                    </div>
                    <ProgressBar
                      now={percent}
                      variant={variant}
                      style={{ height: '8px' }}
                    />
                  </div>
                );
              })}
            </Card.Body>
          </Card>

          {report.coachReport.recommendedPositions && report.coachReport.recommendedPositions.length > 0 && (
            <Card className="mb-4 border-primary">
              <Card.Header className="bg-primary text-white">
                <strong>Рекомендуемые позиции</strong>
              </Card.Header>
              <Card.Body>
                {report.coachReport.recommendedPositions.map((rec, i) => {
                  const variant = rec.suitability >= 70 ? 'success' : rec.suitability >= 40 ? 'warning' : 'secondary';
                  return (
                    <div key={i} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold">
                          {positionLabels[rec.position] ?? rec.position}
                        </span>
                        <Badge bg={variant}>{rec.suitability}%</Badge>
                      </div>
                      <ProgressBar
                        now={rec.suitability}
                        variant={variant}
                        style={{ height: '8px' }}
                      />
                      <p className="text-muted small mt-1 mb-0">{rec.reasoning}</p>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          )}

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

          {report.coachReport.psychologicalPlan && report.coachReport.psychologicalPlan.length > 0 && (
            <Card className="mb-4 border-secondary">
              <Card.Header className="bg-secondary text-white">
                <strong>План работы для психологической службы</strong>
              </Card.Header>
              <ListGroup variant="flush">
                {report.coachReport.psychologicalPlan.map((item, i) => (
                  <ListGroup.Item key={i}>
                    <span className="text-secondary me-2">{i + 1}.</span>
                    {item}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}
        </Col>
      </Row>
      </div>
    </div>
  );
}
