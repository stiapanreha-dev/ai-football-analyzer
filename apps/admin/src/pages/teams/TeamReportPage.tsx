import { useParams, Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { Card, Row, Col, Badge, ProgressBar, ListGroup, Button, Spinner } from 'react-bootstrap';
import { FaCrown, FaFistRaised, FaBrain, FaHandshake, FaCog, FaStar, FaDoorOpen, FaCheck, FaTimes } from 'react-icons/fa';
import html2pdf from 'html2pdf.js';

import { useTeamReport } from '@/features/teams/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime, ARCHETYPES, type ArchetypeCode, type TacticalStyle } from '@archetypes/shared';

const archetypeIcons: Record<ArchetypeCode, React.ReactNode> = {
  leader: <FaCrown className="me-2" />,
  warrior: <FaFistRaised className="me-2" />,
  strategist: <FaBrain className="me-2" />,
  diplomat: <FaHandshake className="me-2" />,
  executor: <FaCog className="me-2" />,
  individualist: <FaStar className="me-2" />,
  avoider: <FaDoorOpen className="me-2" />,
};

const tacticalStyleColors: Record<TacticalStyle, string> = {
  high_press: 'danger',
  reactive: 'warning',
  positional: 'primary',
  direct: 'success',
  adaptive: 'info',
};

export function TeamReportPage() {
  const { id, reportId } = useParams<{ id: string; reportId: string }>();
  const teamId = Number(id);
  const repId = Number(reportId);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: report, isLoading, error, refetch } = useTeamReport(teamId, repId);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !report) return;

    setIsGeneratingPdf(true);
    try {
      const teamName = report.teamName.replace(/\s+/g, '_');
      const filename = `team_report_${teamName}_${report.id}.pdf`;

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

  const sortedProfile = [...report.teamProfile].sort((a, b) => b.averageScore - a.averageScore);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          Тактический отчёт: {report.teamName}
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
          <Link to={`/teams/${teamId}`}>
            <Button variant="outline-secondary">Назад к команде</Button>
          </Link>
        </div>
      </div>

      <div ref={reportRef}>
      <p className="text-muted mb-4">
        Проанализировано игроков: {report.analyzedPlayersCount} |
        Создан: {formatDateTime(report.createdAt)}
      </p>

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <strong>Профиль команды</strong>
            </Card.Header>
            <Card.Body>
              {sortedProfile.map((item) => {
                const variant = item.averageScore >= 7 ? 'success' : item.averageScore >= 4 ? 'warning' : 'secondary';
                return (
                  <div key={item.archetypeCode} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="d-flex align-items-center">
                        {archetypeIcons[item.archetypeCode]}
                        {item.archetypeName}
                      </span>
                      <div>
                        <Badge bg={variant} className="me-2">
                          {item.averageScore.toFixed(1)}
                        </Badge>
                        <small className="text-muted">({item.playerCount} дом.)</small>
                      </div>
                    </div>
                    <ProgressBar
                      now={item.averageScore * 10}
                      variant={variant}
                      style={{ height: '8px' }}
                    />
                  </div>
                );
              })}
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header className="bg-success text-white">
              <strong>Доминирующие архетипы</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {report.dominantArchetypes.map((code) => (
                <ListGroup.Item key={code} className="d-flex align-items-center">
                  {archetypeIcons[code]}
                  {ARCHETYPES[code]?.name ?? code}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          <Card className="mb-4">
            <Card.Header className="bg-warning">
              <strong>Слабые архетипы</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {report.weakArchetypes.map((code) => (
                <ListGroup.Item key={code} className="d-flex align-items-center">
                  {archetypeIcons[code]}
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
              <p style={{ whiteSpace: 'pre-wrap' }}>{report.overallAssessment}</p>
            </Card.Body>
          </Card>

          <h5 className="mb-3">Тактические модели</h5>

          {report.recommendations.map((rec, index) => {
            const variant = rec.suitability >= 70 ? 'success' : rec.suitability >= 40 ? 'warning' : 'secondary';
            return (
              <Card key={rec.style} className={`mb-4 border-${tacticalStyleColors[rec.style]}`}>
                <Card.Header className={`bg-${tacticalStyleColors[rec.style]} ${rec.style !== 'reactive' ? 'text-white' : ''}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>#{index + 1} {rec.styleName}</strong>
                    <Badge bg="light" text="dark" className="fs-6">{rec.suitability}%</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  <ProgressBar
                    now={rec.suitability}
                    variant={variant}
                    className="mb-3"
                    style={{ height: '10px' }}
                  />

                  <p className="mb-3">{rec.reasoning}</p>

                  <Row>
                    <Col md={6}>
                      <h6 className="text-success"><FaCheck className="me-1" /> Плюсы</h6>
                      <ul className="mb-3">
                        {rec.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </Col>
                    <Col md={6}>
                      <h6 className="text-danger"><FaTimes className="me-1" /> Минусы</h6>
                      <ul className="mb-3">
                        {rec.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </Col>
                  </Row>

                  <h6>Ключевые игроки</h6>
                  <ul className="mb-0">
                    {rec.keyPlayers.map((player, i) => (
                      <li key={i}>{player}</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            );
          })}
        </Col>
      </Row>
      </div>
    </div>
  );
}
