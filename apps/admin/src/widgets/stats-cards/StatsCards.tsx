import type { ReactNode } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaUsers, FaTrophy, FaCalendarDay, FaChartLine } from 'react-icons/fa';
import type { DashboardStatsDto } from '@archetypes/shared';
import { formatPercent } from '@archetypes/shared';

interface StatsCardsProps {
  stats: DashboardStatsDto;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: string;
}

function StatCard({ title, value, icon, variant = 'primary' }: StatCardProps) {
  return (
    <Card className={`border-0 bg-${variant} bg-opacity-10`}>
      <Card.Body className="d-flex align-items-center">
        <div className={`fs-1 me-3 text-${variant}`}>{icon}</div>
        <div>
          <div className="text-muted small">{title}</div>
          <div className="fs-4 fw-bold">{value}</div>
        </div>
      </Card.Body>
    </Card>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <Row className="g-4 mb-4">
      <Col md={6} lg={3}>
        <StatCard
          title="Всего игроков"
          value={stats.totalPlayers}
          icon={<FaUsers />}
          variant="primary"
        />
      </Col>
      <Col md={6} lg={3}>
        <StatCard
          title="Завершённых сессий"
          value={stats.completedSessions}
          icon={<FaTrophy />}
          variant="success"
        />
      </Col>
      <Col md={6} lg={3}>
        <StatCard
          title="Сессий сегодня"
          value={stats.todaySessions}
          icon={<FaCalendarDay />}
          variant="info"
        />
      </Col>
      <Col md={6} lg={3}>
        <StatCard
          title="Completion Rate"
          value={formatPercent(stats.completionRate)}
          icon={<FaChartLine />}
          variant="warning"
        />
      </Col>
    </Row>
  );
}
