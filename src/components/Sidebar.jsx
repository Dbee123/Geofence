import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import MapIcon from '@mui/icons-material/Map';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import styles from './Sidebar.module.css';

const links = [
  { to: '/', icon: <DashboardIcon />, label: 'Dashboard' },
  { to: '/users', icon: <GroupIcon />, label: 'Users' },
  { to: '/geofences', icon: <MapIcon />, label: 'Geofences' },
  { to: '/complaints', icon: <HelpIcon />, label: 'Complaints' },
  { to: '/reports', icon: <BarChartIcon />, label: 'Reports' },
];

const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(`.${styles.toggleButton}`) &&
        window.innerWidth <= 768
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  return (
    <>
      <button 
        className={styles.toggleButton} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        <MenuIcon />
      </button>

      {window.innerWidth <= 768 && (
        <div 
          className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav 
        className={`${styles.sidebarNav} ${isOpen ? styles.open : ''}`} 
        ref={sidebarRef}
      >
        <ul className={styles.sidebarList}>
          {links.map(({ to, icon, label }) => (
            <li
              key={to}
              className={`${styles.sidebarItem} ${location.pathname === to ? 'active' : ''}`}
            >
              <Tooltip title={label} placement="right">
                <Link to={to} className={styles.iconLink}>
                  {icon}
                </Link>
              </Tooltip>
            </li>
          ))}
        </ul>

        <button className={styles.logoutButton} onClick={handleLogout}>
          <Tooltip title="Logout" placement="right">
            <span className={styles.iconLink}>
              <LogoutIcon />
            </span>
          </Tooltip>
        </button>
      </nav>
    </>
  );
};

export default SideBar;