import type { ReactNode } from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import {
  FaChartPie,
  FaUsers,
  FaPlay,
  FaFileAlt,
  FaKey,
  FaRobot,
  FaClipboardList,
  FaCog,
  FaUserFriends,
  FaUserShield,
} from 'react-icons/fa';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Дашборд', icon: <FaChartPie /> },
  { path: '/players', label: 'Игроки', icon: <FaUsers /> },
  { path: '/teams', label: 'Команды', icon: <FaUserFriends /> },
  { path: '/sessions', label: 'Сессии', icon: <FaPlay /> },
  { path: '/reports', label: 'Отчёты', icon: <FaFileAlt /> },
  { path: '/pins', label: 'PIN-коды', icon: <FaKey /> },
  { path: '/prompts', label: 'Промпты', icon: <FaRobot /> },
  { path: '/audit', label: 'Аудит лог', icon: <FaClipboardList /> },
  { path: '/admins', label: 'Администраторы', icon: <FaUserShield /> },
  { path: '/settings', label: 'Настройки', icon: <FaCog /> },
];

export function Sidebar() {
  return (
    <div
      className="bg-dark text-white p-3 d-flex flex-column"
      style={{ width: '240px', minWidth: '240px' }}
    >
      <div className="mb-4 text-center">
        <h5 className="mb-0">Admin Panel</h5>
      </div>

      <Nav className="flex-column flex-grow-1">
        {navItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={NavLink}
            to={item.path}
            className="text-white-50 py-2 px-3 rounded mb-1"
          >
            <span className="me-2">{item.icon}</span>
            {item.label}
          </Nav.Link>
        ))}
      </Nav>

      <div className="text-center text-white-50 small pt-3 border-top border-secondary">
        v1.0.0
      </div>
    </div>
  );
}
