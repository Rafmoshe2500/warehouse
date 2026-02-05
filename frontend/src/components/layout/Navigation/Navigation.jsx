import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiPackage, FiActivity, FiUsers, FiClock, FiPieChart, FiShoppingCart } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { isAdmin, hasPermission } = useAuth();

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `navigation__link ${isActive ? 'navigation__link--active' : ''}`
          }
        >
          <FiPieChart size={20} />
          <span>דשבורד</span>
        </NavLink>

        {(hasPermission('inventory:ro') || hasPermission('inventory:rw')) && (
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            <FiPackage size={20} />
            <span>מלאי</span>
          </NavLink>
        )}

        {(hasPermission('procurement:ro') || hasPermission('procurement:rw')) && (
          <NavLink
            to="/procurement"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            <FiShoppingCart size={20} />
            <span>ניהול רכש</span>
          </NavLink>
        )}

        {(hasPermission('inventory:ro') || hasPermission('inventory:rw')) && (
          <NavLink
            to="/stale"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            <FiClock size={20} />
            <span>פריטים ישנים</span>
          </NavLink>
        )}

        {(isAdmin || hasPermission('inventory:ro') || hasPermission('inventory:rw')) && (
          <NavLink
            to="/logs"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            <FiActivity size={20} />
            <span>לוג פעולות</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            <FiUsers size={20} />
            <span>ניהול מערכת</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
