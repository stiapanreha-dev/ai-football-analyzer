import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';

import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <Navbar />
        <main className="flex-grow-1 overflow-auto p-4 bg-light">
          <Container fluid>
            <Outlet />
          </Container>
        </main>
      </div>
    </div>
  );
}
