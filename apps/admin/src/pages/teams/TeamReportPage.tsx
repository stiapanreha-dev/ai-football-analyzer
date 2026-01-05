import { useParams, Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { Card, Row, Col, Badge, ProgressBar, ListGroup, Button, Spinner, Accordion, Table } from 'react-bootstrap';
import {
  FaCrown, FaFistRaised, FaBrain, FaHandshake, FaCog, FaStar, FaDoorOpen,
  FaCheck, FaTimes, FaExclamationTriangle, FaChartLine, FaExchangeAlt,
  FaUsers, FaDumbbell, FaDatabase, FaUserTie, FaShoppingCart
} from 'react-icons/fa';
import html2pdf from 'html2pdf.js';

import { useTeamReport } from '@/features/teams/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime, ARCHETYPES, type ArchetypeCode, type TacticalStyle, type ExtendedTeamAnalysis } from '@archetypes/shared';

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

const substitutionScenarioNames: Record<string, string> = {
  hold_lead: 'Удержание счёта',
  increase_pressure: 'Усиление давления',
  break_low_block: 'Взлом низкого блока',
  stabilize_after_goal: 'Стабилизация после гола',
};

const lineNames: Record<string, string> = {
  defense: 'Оборона',
  midfield: 'Полузащита',
  attack: 'Атака',
};

function ExtendedAnalysisSection({ analysis }: { analysis: ExtendedTeamAnalysis }) {
  return (
    <div className="mt-5">
      <h5 className="mb-4">Расширенный анализ</h5>
      <Accordion defaultActiveKey="0">
        {/* 1. Дефициты архетипов */}
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <FaExclamationTriangle className="me-2 text-danger" />
            1. Дефициты архетипов
          </Accordion.Header>
          <Accordion.Body>
            {analysis.deficits.deficits.length > 0 ? (
              <>
                {analysis.deficits.deficits.map((deficit, i) => (
                  <Card key={i} className={`mb-3 ${deficit.isCritical ? 'border-danger' : 'border-warning'}`}>
                    <Card.Header className={deficit.isCritical ? 'bg-danger text-white' : 'bg-warning'}>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{deficit.archetypeName}</strong>
                        <div>
                          <Badge bg="light" text="dark" className="me-2">{deficit.averageScore.toFixed(1)}</Badge>
                          <Badge bg={deficit.isCritical ? 'dark' : 'secondary'}>
                            {deficit.isCritical ? 'Критичный' : 'Допустимый'}
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={4}>
                          <h6 className="text-danger">Игровые риски</h6>
                          <ul className="small">{deficit.gameRisks.map((r, j) => <li key={j}>{r}</li>)}</ul>
                        </Col>
                        <Col md={4}>
                          <h6 className="text-warning">Психологические риски</h6>
                          <ul className="small">{deficit.psychologicalRisks.map((r, j) => <li key={j}>{r}</li>)}</ul>
                        </Col>
                        <Col md={4}>
                          <h6 className="text-info">Тактические риски</h6>
                          <ul className="small">{deficit.tacticalRisks.map((r, j) => <li key={j}>{r}</li>)}</ul>
                        </Col>
                      </Row>
                      <h6>Критичные фазы игры</h6>
                      <p className="small mb-0">{deficit.criticalPhases.join(', ')}</p>
                    </Card.Body>
                  </Card>
                ))}
                <Row>
                  <Col md={6}>
                    <h6>Каких игроков не хватает</h6>
                    <ul>{analysis.deficits.missingPlayerTypes.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </Col>
                  <Col md={6}>
                    <h6>Трансферные гипотезы</h6>
                    <ul>{analysis.deficits.transferHypotheses.map((h, i) => <li key={i}>{h}</li>)}</ul>
                  </Col>
                </Row>
              </>
            ) : (
              <p className="text-muted">Критических дефицитов не выявлено</p>
            )}
          </Accordion.Body>
        </Accordion.Item>

        {/* 2. Потенциал развития */}
        <Accordion.Item eventKey="1">
          <Accordion.Header>
            <FaChartLine className="me-2 text-success" />
            2. Потенциал развития архетипов
          </Accordion.Header>
          <Accordion.Body>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Архетип</th>
                  <th>Тип</th>
                  <th>Методы развития</th>
                  <th>Ограничения</th>
                </tr>
              </thead>
              <tbody>
                {analysis.developmentPotential.archetypes.map((arch, i) => (
                  <tr key={i}>
                    <td><strong>{arch.archetypeName}</strong></td>
                    <td>
                      <Badge bg={arch.isDevelopable ? 'success' : 'secondary'}>
                        {arch.isDevelopable ? 'Развиваемый' : 'Врождённый'}
                      </Badge>
                    </td>
                    <td className="small">{arch.developmentMethods.join('; ')}</td>
                    <td className="small text-danger">{arch.limitations.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Row className="mt-3">
              <Col md={6}>
                <Card className="border-success">
                  <Card.Header className="bg-success text-white">Развивать</Card.Header>
                  <Card.Body>
                    <ul className="mb-0">{analysis.developmentPotential.developRecommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="border-info">
                  <Card.Header className="bg-info text-white">Компенсировать трансферами</Card.Header>
                  <Card.Body>
                    <ul className="mb-0">{analysis.developmentPotential.compensateRecommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* 3. Тактические уязвимости */}
        <Accordion.Item eventKey="2">
          <Accordion.Header>
            <FaExclamationTriangle className="me-2 text-warning" />
            3. Тактические уязвимости
          </Accordion.Header>
          <Accordion.Body>
            {analysis.tacticalVulnerabilities.vulnerabilities.map((vuln, i) => (
              <Card key={i} className="mb-3 border-warning">
                <Card.Header className="bg-warning">
                  <strong>{vuln.imbalance}</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <h6>Опасные соперники</h6>
                      <ul className="small">{vuln.dangerousOpponents.map((o, j) => <li key={j}>{o}</li>)}</ul>
                    </Col>
                    <Col md={4}>
                      <h6>Сценарии риска</h6>
                      <ul className="small">{vuln.riskScenarios.map((s, j) => <li key={j}>{s}</li>)}</ul>
                    </Col>
                    <Col md={4}>
                      <h6>Компенсация</h6>
                      <ul className="small">{vuln.compensation.map((c, j) => <li key={j}>{c}</li>)}</ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
            <h6>Опасные матч-апы</h6>
            <p>{analysis.tacticalVulnerabilities.dangerousMatchups.join('; ')}</p>
          </Accordion.Body>
        </Accordion.Item>

        {/* 4. Распределение по линиям */}
        <Accordion.Item eventKey="3">
          <Accordion.Header>
            <FaUsers className="me-2 text-primary" />
            4. Распределение по ролям и линиям
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              {analysis.roleDistribution.lineDistribution.map((line, i) => (
                <Col md={4} key={i}>
                  <Card className="mb-3">
                    <Card.Header className="bg-primary text-white">
                      <strong>{lineNames[line.line] ?? line.lineName}</strong>
                    </Card.Header>
                    <Card.Body>
                      <h6>Доминирующие</h6>
                      <p className="small text-success">{line.dominantArchetypes.join(', ') || '—'}</p>
                      <h6>Вакуумы</h6>
                      <p className="small text-danger">{line.gaps.join(', ') || '—'}</p>
                      <h6>Перегрузки</h6>
                      <p className="small text-warning">{line.overloads.join(', ') || '—'}</p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            <h6>Сочетания архетипов</h6>
            <Table striped size="sm">
              <thead>
                <tr><th>Архетипы</th><th>Эффект</th><th>Описание</th></tr>
              </thead>
              <tbody>
                {analysis.roleDistribution.combinations.map((comb, i) => (
                  <tr key={i}>
                    <td>{comb.archetypes.join(' + ')}</td>
                    <td>
                      <Badge bg={comb.effect === 'synergy' ? 'success' : 'danger'}>
                        {comb.effect === 'synergy' ? 'Синергия' : 'Конфликт'}
                      </Badge>
                    </td>
                    <td className="small">{comb.description}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <h6>Рекомендации по ролям</h6>
            <ul>{analysis.roleDistribution.roleRecommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </Accordion.Body>
        </Accordion.Item>

        {/* 5. Стратегия замен */}
        <Accordion.Item eventKey="4">
          <Accordion.Header>
            <FaExchangeAlt className="me-2 text-info" />
            5. Стратегия замен
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              {analysis.substitutionStrategy.scenarios.map((scenario, i) => (
                <Col md={6} key={i}>
                  <Card className="mb-3">
                    <Card.Header className="bg-info text-white">
                      <strong>{substitutionScenarioNames[scenario.scenario] ?? scenario.scenarioName}</strong>
                    </Card.Header>
                    <Card.Body>
                      <p className="small"><strong>Нужные архетипы:</strong> {scenario.neededArchetypes.join(', ')}</p>
                      <p className="small"><strong>Время:</strong> {scenario.optimalTiming}</p>
                      <p className="small mb-0"><strong>Игроки:</strong> {scenario.playerRecommendations.join(', ')}</p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            <h6>Общие рекомендации</h6>
            <ul>{analysis.substitutionStrategy.generalRecommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </Accordion.Body>
        </Accordion.Item>

        {/* 6. Тренировочный процесс */}
        <Accordion.Item eventKey="5">
          <Accordion.Header>
            <FaDumbbell className="me-2 text-secondary" />
            6. Тренировочный процесс
          </Accordion.Header>
          <Accordion.Body>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Архетип</th>
                  <th>Эффективные упражнения</th>
                  <th>Фрустрирующие форматы</th>
                </tr>
              </thead>
              <tbody>
                {analysis.trainingProcess.archetypeProfiles.map((profile, i) => (
                  <tr key={i}>
                    <td><strong>{profile.archetypeName}</strong></td>
                    <td className="small text-success">{profile.effectiveExercises.join('; ')}</td>
                    <td className="small text-danger">{profile.frustratingFormats.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Row className="mt-3">
              <Col md={6}>
                <h6>Баланс структуры и свободы</h6>
                <ul>{analysis.trainingProcess.balanceRecommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </Col>
              <Col md={6}>
                <h6>Упражнения для недопредставленных архетипов</h6>
                <ul>{analysis.trainingProcess.underdevelopedArchetypeExercises.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* 7. Дополнительные данные */}
        <Accordion.Item eventKey="6">
          <Accordion.Header>
            <FaDatabase className="me-2 text-dark" />
            7. Дополнительные данные для модели
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={4}>
                <h6>Поведенческие метрики</h6>
                <ul className="small">{analysis.additionalData.behavioralMetrics.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </Col>
              <Col md={4}>
                <h6>Контекстуальные метрики</h6>
                <ul className="small">{analysis.additionalData.contextualMetrics.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </Col>
              <Col md={4}>
                <h6>Психологические метрики</h6>
                <ul className="small">{analysis.additionalData.psychologicalMetrics.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <h6>Для отслеживания динамики</h6>
                <ul className="small">{analysis.additionalData.dynamicTrackingMetrics.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </Col>
              <Col md={6}>
                <h6>Ключевые игровые события</h6>
                <ul className="small">{analysis.additionalData.keyGameEvents.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Card className="border-success">
                  <Card.Header className="bg-success text-white">Минимальный набор</Card.Header>
                  <Card.Body>
                    <ul className="small mb-0">{analysis.additionalData.minimalMetricsSet.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="border-primary">
                  <Card.Header className="bg-primary text-white">Расширенный набор</Card.Header>
                  <Card.Body>
                    <ul className="small mb-0">{analysis.additionalData.extendedMetricsSet.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* 8. Трансферная стратегия */}
        <Accordion.Item eventKey="7">
          <Accordion.Header>
            <FaShoppingCart className="me-2 text-success" />
            8. Трансферная стратегия
          </Accordion.Header>
          <Accordion.Body>
            <h6>Приоритетные архетипы для усиления</h6>
            <p>{analysis.transferStrategy.priorityArchetypes.join(', ')}</p>

            <h6 className="mt-3">Трансферные цели</h6>
            {analysis.transferStrategy.transferTargets.map((target, i) => (
              <Card key={i} className="mb-2">
                <Card.Body>
                  <Row>
                    <Col md={3}><strong>Позиция:</strong> {target.position}</Col>
                    <Col md={3}><strong>Архетипы:</strong> {target.neededArchetypes.join(', ')}</Col>
                    <Col md={3}><strong>Идеал:</strong> {target.idealCombination}</Col>
                    <Col md={3}><strong className="text-danger">Риски:</strong> {target.risks.join(', ')}</Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

            <h6 className="mt-3">Требования к легионерам</h6>
            <ul>{analysis.transferStrategy.foreignPlayerRequirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </Accordion.Body>
        </Accordion.Item>

        {/* 9. Совместимость с тренером */}
        <Accordion.Item eventKey="8">
          <Accordion.Header>
            <FaUserTie className="me-2 text-dark" />
            9. Совместимость с тренером
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={4}>
                <Card className="border-success mb-3">
                  <Card.Header className="bg-success text-white">Идеальный тип тренера</Card.Header>
                  <Card.Body>
                    <h5 className="mb-0">{analysis.coachCompatibility.idealCoachType}</h5>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-danger mb-3">
                  <Card.Header className="bg-danger text-white">Конфликтующие типы</Card.Header>
                  <Card.Body>
                    <ul className="mb-0">{analysis.coachCompatibility.conflictingCoachTypes.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-warning mb-3">
                  <Card.Header className="bg-warning">Риски смены тренера</Card.Header>
                  <Card.Body>
                    <ul className="mb-0">{analysis.coachCompatibility.coachChangeRisks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <h6>Совместимость по типам тренеров</h6>
            <Table striped size="sm">
              <thead>
                <tr><th>Тип тренера</th><th>Совместимость</th><th>Обоснование</th></tr>
              </thead>
              <tbody>
                {analysis.coachCompatibility.coachTypes.map((ct, i) => (
                  <tr key={i}>
                    <td><strong>{ct.coachType}</strong></td>
                    <td>
                      <Badge bg={ct.compatibility === 'high' ? 'success' : ct.compatibility === 'medium' ? 'warning' : 'danger'}>
                        {ct.compatibility === 'high' ? 'Высокая' : ct.compatibility === 'medium' ? 'Средняя' : 'Низкая'}
                      </Badge>
                    </td>
                    <td className="small">{ct.reasoning}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

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

      {/* Extended Analysis (9 sections from TZ) */}
      {report.extendedAnalysis && (
        <ExtendedAnalysisSection analysis={report.extendedAnalysis} />
      )}
      </div>
    </div>
  );
}
