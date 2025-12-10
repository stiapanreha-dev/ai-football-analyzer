import { useState } from 'react';
import { Card, Table, Badge, Pagination, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { useReports, useGenerateMissingReports } from '@/features/reports/hooks';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime } from '@archetypes/shared';

const strengthLabels: Record<string, { label: string; variant: string }> = {
  dominant: { label: 'Доминирующий', variant: 'success' },
  moderate: { label: 'Умеренный', variant: 'primary' },
  weak: { label: 'Слабый', variant: 'warning' },
  absent: { label: 'Отсутствует', variant: 'secondary' },
};

export function ReportsListPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useReports({
    page,
    pageSize: 20,
  });

  const generateMutation = useGenerateMissingReports();

  const handleGenerateMissing = () => {
    generateMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message="Не удалось загрузить отчёты" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Отчёты по игрокам</h4>
        <Button
          variant="success"
          onClick={handleGenerateMissing}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <>
              <Spinner size="sm" className="me-2" />
              Генерация...
            </>
          ) : (
            'Сгенерировать отчёты'
          )}
        </Button>
      </div>

      {generateMutation.isSuccess && generateMutation.data.generated > 0 && (
        <Alert variant="success" className="mb-3">
          Успешно сгенерировано {generateMutation.data.generated} отчётов
        </Alert>
      )}

      {generateMutation.isSuccess && generateMutation.data.generated === 0 && (
        <Alert variant="info" className="mb-3">
          Все завершённые сессии уже имеют отчёты
        </Alert>
      )}

      {generateMutation.isError && (
        <Alert variant="danger" className="mb-3">
          Ошибка генерации: {(generateMutation.error as Error).message}
        </Alert>
      )}

      <Card>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Игрок</th>
                <th>Позиция</th>
                <th>Топ архетипы</th>
                <th>Создан</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((report) => {
                const topScores = [...report.scores]
                  .sort((a, b) => b.finalScore - a.finalScore)
                  .slice(0, 2);

                return (
                  <tr key={report.id}>
                    <td>#{report.id}</td>
                    <td>
                      <strong>{report.player.name ?? `Игрок #${report.player.id}`}</strong>
                    </td>
                    <td>
                      {report.player.position ? (
                        <Badge bg="info">{report.player.position}</Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {topScores.map((score) => {
                        const strengthInfo = strengthLabels[score.strength] ?? {
                          label: score.strength,
                          variant: 'secondary',
                        };
                        return (
                          <Badge
                            key={score.archetypeCode}
                            bg={strengthInfo.variant}
                            className="me-1"
                          >
                            {score.archetypeName}: {score.finalScore.toFixed(1)}
                          </Badge>
                        );
                      })}
                    </td>
                    <td>{formatDateTime(report.createdAt)}</td>
                    <td>
                      <Link to={`/reports/${report.id}`}>
                        <Button variant="outline-primary" size="sm">
                          Подробнее
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!data?.items.length && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Отчёты не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
        {data && data.totalPages > 1 && (
          <Card.Footer>
            <Pagination className="mb-0 justify-content-center">
              <Pagination.Prev
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              />
              {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <Pagination.Item
                  key={p}
                  active={p === page}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
              />
            </Pagination>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
}
