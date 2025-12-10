import { Spinner } from 'react-bootstrap';

interface LoadingSpinnerProps {
  size?: 'sm' | undefined;
  text?: string;
}

export function LoadingSpinner({ size, text = 'Загрузка...' }: LoadingSpinnerProps) {
  return (
    <div className="d-flex align-items-center justify-content-center p-4">
      <Spinner animation="border" role="status" size={size} className="me-2">
        <span className="visually-hidden">{text}</span>
      </Spinner>
      <span className="text-muted">{text}</span>
    </div>
  );
}
