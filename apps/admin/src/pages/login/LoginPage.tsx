import { Container, Card, Alert, Spinner } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/shared/lib/useAuth';
import { useLoginTelegram } from '@/features/auth/hooks';
import { TelegramLoginButton } from '@/features/auth/TelegramLoginButton';
import { config } from '@/shared/config';

export function LoginPage() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const loginMutation = useLoginTelegram();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <Card style={{ width: '400px' }} className="shadow">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h2 className="text-primary fw-bold">Football Archetypes</h2>
            <p className="text-muted">Панель администратора</p>
          </div>

          {loginMutation.isError && (
            <Alert variant="danger" className="mb-3">
              {loginMutation.error instanceof Error
                ? loginMutation.error.message
                : 'Ошибка авторизации. Убедитесь, что вы добавлены как администратор.'}
            </Alert>
          )}

          {loginMutation.isPending ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Авторизация...</p>
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center gap-3">
              <p className="text-muted mb-2">
                Войдите через Telegram для доступа к панели управления
              </p>
              <TelegramLoginButton
                botName={config.telegramBotName}
                onAuth={(data) => loginMutation.mutate(data)}
                buttonSize="large"
                cornerRadius={8}
                showUserPic={true}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
