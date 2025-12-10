import { Card, ListGroup, Badge } from 'react-bootstrap';

import { useDashboardStats, useRecentActivity } from '@/features/dashboard/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { StatsCards } from '@/widgets/stats-cards/StatsCards';
import { formatRelativeTime } from '@archetypes/shared';

const activityTypeLabels: Record<string, { label: string; variant: string }> = {
  session_completed: { label: 'Завершена', variant: 'success' },
  session_started: { label: 'Начата', variant: 'primary' },
  player_registered: { label: 'Регистрация', variant: 'info' },
  pin_created: { label: 'PIN создан', variant: 'warning' },
};

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(10);

  if (statsLoading) {
    return <LoadingSpinner />;
  }

  if (statsError) {
    return <ErrorAlert message="Не удалось загрузить статистику" />;
  }

  return (
    <div>
      <h4 className="mb-4">Дашборд</h4>

      {stats && <StatsCards stats={stats} />}

      <Card>
        <Card.Header>
          <strong>Последние события</strong>
        </Card.Header>
        <Card.Body className="p-0">
          {activitiesLoading ? (
            <LoadingSpinner />
          ) : (
            <ListGroup variant="flush">
              {activities?.map((activity, index) => {
                const typeInfo = activityTypeLabels[activity.type] ?? {
                  label: activity.type,
                  variant: 'secondary',
                };
                return (
                  <ListGroup.Item
                    key={`${activity.type}-${activity.entityId}-${index}`}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <Badge bg={typeInfo.variant} className="me-2">
                        {typeInfo.label}
                      </Badge>
                      {activity.description}
                    </div>
                    <small className="text-muted">
                      {formatRelativeTime(activity.timestamp)}
                    </small>
                  </ListGroup.Item>
                );
              })}
              {!activities?.length && (
                <ListGroup.Item className="text-muted text-center">
                  Нет событий
                </ListGroup.Item>
              )}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
