import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/shared/lib/useAuth';
import { useLogin } from '@/features/auth/hooks';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const loginMutation = useLogin();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

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
              Неверный пароль
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль тренера"
                required
                autoFocus
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Вход...' : 'Войти'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
