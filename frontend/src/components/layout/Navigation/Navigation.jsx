import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiPackage, FiSettings, FiShoppingCart, FiPieChart, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { PermissionGate } from '../../common';
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

        <PermissionGate permission="inventory:ro">
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            <FiPackage size={20} />
            <span>מלאי</span>
          </NavLink>
        </PermissionGate>

        <PermissionGate permission="procurement:ro">
          <NavLink
            to="/procurement"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            <FiShoppingCart size={20} />
            <span>ניהול רכש</span>
          </NavLink>
        </PermissionGate>

        {/* Admin Link - handled by internal logic of PermissionGate or just keep simple check if complex */}
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
