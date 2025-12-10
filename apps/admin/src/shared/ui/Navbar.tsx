import { Navbar as BsNavbar, Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/useAuth';

export function Navbar() {
  const navigate = useNavigate();
  const logout = useAuth((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BsNavbar bg="white" className="border-bottom shadow-sm">
      <Container fluid>
        <BsNavbar.Brand className="fw-bold text-primary">
          Football Archetypes
        </BsNavbar.Brand>
        <BsNavbar.Collapse className="justify-content-end">
          <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
            Выйти
          </Button>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
