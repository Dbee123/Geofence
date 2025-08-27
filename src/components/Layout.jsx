import { Outlet } from 'react-router-dom';
import SideBar from './Sidebar';
import styles from './Layout.module.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = () => (
  <div className={styles.container}>
    <div className={styles.sidebar}>
      <SideBar />
    </div>
    <main className={styles.content}>
      <ToastContainer position="top-right" autoClose={5000} />
      <Outlet />
    </main>
  </div>
);

export default Layout;
