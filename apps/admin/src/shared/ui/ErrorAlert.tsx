import { Alert } from 'react-bootstrap';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <Alert variant="danger">
      <Alert.Heading>Ошибка</Alert.Heading>
      <p className="mb-0">{message}</p>
      {onRetry && (
        <div className="mt-3">
          <Alert.Link onClick={onRetry}>Попробовать снова</Alert.Link>
        </div>
      )}
    </Alert>
  );
}
