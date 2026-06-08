import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiMessageCircle,
  FiCheckSquare,
  FiCalendar,
  FiGithub,
  FiMonitor,
  FiSettings,
} from 'react-icons/fi';
import { useWidgetManager } from './WidgetManager.jsx';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const { openWidgetModal } = useWidgetManager()

  const menuItems = [
    { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
    { name: 'AI Assistant', icon: FiMessageCircle, path: '/assistant' },
    { name: 'Tasks', icon: FiCheckSquare, path: '/tasks' },
    { name: 'Calendar', icon: FiCalendar, path: '/calendar' },
    { name: 'GitHub', icon: FiGithub, path: '/github' },
    { name: 'Monitoring', icon: FiMonitor, path: '/monitoring' },
    { name: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Menu Items */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              title={item.name}
            >
              <Icon className="menu-icon" size={24} />
              {isOpen && <span className="menu-label">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Card */}
      <div className="sidebar-bottom">
        <div className="system-status-card">
          <div className="status-header">
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">
                {isOpen ? 'All Systems Operational' : ''}
              </span>
            </div>
          </div>
          {isOpen && (
            <>
              <p className="status-subtitle">Updated just now</p>
              <button className="add-widget-btn" type="button" onClick={openWidgetModal}>
                + Add Widget
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
