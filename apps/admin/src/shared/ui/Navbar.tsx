import { Navbar as BsNavbar, Container, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/useAuth';

export function Navbar() {
  const navigate = useNavigate();
  const logout = useAuth((state) => state.logout);
  const admin = useAuth((state) => state.admin);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDisplayName = () => {
    if (admin?.firstName || admin?.lastName) {
      return [admin.firstName, admin.lastName].filter(Boolean).join(' ');
    }
    if (admin?.username) return `@${admin.username}`;
    return 'Администратор';
  };

  return (
    <BsNavbar bg="white" className="border-bottom shadow-sm">
      <Container fluid>
        <BsNavbar.Brand className="fw-bold text-primary">
          Football Archetypes
        </BsNavbar.Brand>
        <BsNavbar.Collapse className="justify-content-end">
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="link"
              className="d-flex align-items-center gap-2 text-decoration-none text-dark"
            >
              {admin?.photoUrl ? (
                <img
                  src={admin.photoUrl}
                  alt=""
                  className="rounded-circle"
                  style={{ width: 32, height: 32 }}
                />
              ) : (
                <div
                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                  style={{ width: 32, height: 32 }}
                >
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
              )}
              <span className="d-none d-md-inline">{getDisplayName()}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleLogout}>Выйти</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
