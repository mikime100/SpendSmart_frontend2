import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiDollarSign, FiTarget, FiLogOut } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <FiDollarSign className="brand-icon" />
          <span>SpendSmart</span>
        </div>
        <div className="navbar-menu">
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <FiHome /> Dashboard
          </Link>
          <Link
            to="/expenses"
            className={`nav-link ${location.pathname === '/expenses' ? 'active' : ''}`}
          >
            <FiDollarSign /> Expenses
          </Link>
          <Link
            to="/budgets"
            className={`nav-link ${location.pathname === '/budgets' ? 'active' : ''}`}
          >
            <FiTarget /> Budgets
          </Link>
        </div>
        <div className="navbar-user">
          <span className="username">{user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;



