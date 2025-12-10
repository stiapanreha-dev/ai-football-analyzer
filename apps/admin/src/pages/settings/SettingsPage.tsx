import { Card, ListGroup } from 'react-bootstrap';

export function SettingsPage() {
  return (
    <div>
      <h4 className="mb-4">Настройки</h4>

      <Card>
        <Card.Header>
          <strong>Параметры системы</strong>
        </Card.Header>
        <ListGroup variant="flush">
          <ListGroup.Item className="d-flex justify-content-between">
            <span>Минимум ситуаций</span>
            <strong>4</strong>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between">
            <span>Максимум ситуаций</span>
            <strong>6</strong>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between">
            <span>Порог уточнения</span>
            <strong>3.0</strong>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between">
            <span>LLM провайдер</span>
            <strong>OpenAI GPT-4o</strong>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between">
            <span>STT провайдер</span>
            <strong>OpenAI Whisper</strong>
          </ListGroup.Item>
        </ListGroup>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <strong>О системе</strong>
        </Card.Header>
        <Card.Body>
          <p className="mb-2">
            <strong>Football Archetypes</strong> - система психологического профилирования
            футболистов через Telegram бота с голосовым вводом.
          </p>
          <p className="mb-0 text-muted">
            Определяет 7 архетипов личности игрока: Лидер, Воин, Стратег, Дипломат,
            Исполнитель, Индивидуалист, Избегающий.
          </p>
        </Card.Body>
        <Card.Footer className="text-muted">
          Версия 1.0.0
        </Card.Footer>
      </Card>
    </div>
  );
}
