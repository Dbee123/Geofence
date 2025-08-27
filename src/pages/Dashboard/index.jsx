import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getSystemStats,
  getAttendances,
  getComplaints,
  getAttendanceReport
} from '../../api';
import "bootstrap-icons/font/bootstrap-icons.css";
import { format, subDays } from 'date-fns';
import styles from './Dashboard.module.css';
import { useNavigate } from 'react-router-dom';


// Icons
const PeopleIcon = () => <i className={`${styles.icon} bi bi-people`} />;
const MapIcon = () => <i className={`${styles.icon} bi bi-map`} />;
const TimeIcon = () => <i className={`${styles.icon} bi bi-clock`} />;
const ChatIcon = () => <i className={`${styles.icon} bi bi-question-circle-fill`} />;
const RefreshIcon = () => <i className={`${styles.icon} bi bi-arrow-clockwise`} />;
const ClockInIcon = () => <i className={`${styles.icon} bi bi-box-arrow-in-left`} />;
const ClockOutIcon = () => <i className={`${styles.icon} bi bi-box-arrow-in-right`} />;
const ResolvedIcon = () => <i className={`${styles.icon} bi bi-check-square-filled`} />;
const PendingIcon = () => <i className={`${styles.icon} bi bi-hourglass`} />;

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sevenDaysAgo = subDays(new Date(), 7);
      const [statsRes, attendancesRes, complaintsRes, chartRes] = await Promise.all([
        getSystemStats(),
        getAttendances({ limit: 5, ordering: '-timestamp' }),
        getComplaints(),
        getAttendanceReport({
          start_date: format(sevenDaysAgo, 'yyyy-MM-dd'),
          group_by: 'day'
        })
      ]);

      setStats(statsRes.data);
      setRecentAttendances(attendancesRes.data || []);
      setRecentComplaints(complaintsRes.data?.slice(0, 5) || []);
      
      // Ensure attendanceData is always an array
      const chartData = Array.isArray(chartRes.data) ? chartRes.data : [];
      console.log('Chart data:', chartData);

      setAttendanceData(chartData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setAttendanceData([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const StatCard = ({ title, value, icon, trend }) => {
    const trendColors = {
      up: styles.trendUp,
      down: styles.trendDown,
      neutral: styles.trendNeutral
    };
    
    return (
      <div className={styles.statCard}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statContent}>
          <h3>{title}</h3>
          <p>{value ?? 0}</p>
        </div>
        {trend && <div className={`${styles.trend} ${trendColors[trend]}`} />}
      </div>
    );
  };

  const QuickActions = () => (
    <div className={styles.quickActions}>
  <h3>Quick Actions</h3>
  <div className={styles.actionGrid}>
    <button className={styles.actionButton} onClick={() => navigate('/users')}>
      <PeopleIcon /> Manage Users
    </button>
    <button className={styles.actionButton} onClick={() => navigate('/geofences')}>
      <MapIcon /> Manage Geofences
    </button>
    <button className={styles.actionButton} onClick={() => navigate('/complaints')}>
      <ChatIcon /> View Complaints
    </button>
    <button className={styles.actionButton} onClick={() => navigate('/reports')}>
      <TimeIcon /> Generate Reports
    </button>
  </div>
</div>
  );

  const ActivityFeed = ({ title, data = [], type }) => {
    if (!data || data.length === 0) {
      return (
        <div className={styles.activityFeed}>
          <h3>{title}</h3>
          <p className={styles.emptyFeed}>No data available</p>
        </div>
      );
    }

    return (
      <div className={styles.activityFeed}>
        <h3>{title}</h3>
        <div className={styles.feedContent}>
          <ul className={styles.feedList}>
            {data.map((item) => (
              <li key={item.id} className={styles.feedItem}>
                {type === 'attendance' ? (
                  <>
                    <div className={styles.feedIcon}>
                      {item.type === 'clock-in' ? <ClockInIcon /> : <ClockOutIcon />}
                    </div>
                    <div className={styles.feedDetails}>
                      <span className={styles.feedUser}>{item.user_details?.username}</span>
                      <span className={styles.feedTime}>
                        {format(new Date(item.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <div className={styles.feedLocation}>
                      {item.geofence_details?.name}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.feedIcon}>
                      {item.status === 'resolved' ? <ResolvedIcon /> : <PendingIcon />}
                    </div>
                    <div className={styles.feedDetails}>
                      <span className={styles.feedSubject}>{item.subject}</span>
                      <span className={styles.feedTime}>
                        {format(new Date(item.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className={`${styles.feedStatus} ${styles[item.status]}`}>
                      {item.status}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const AttendanceChart = () => {
    // Ensure attendanceData is always an array
    const chartData = Array.isArray(attendanceData) ? attendanceData : [];
    
    if (chartData.length === 0) {
      return (
        <div className={styles.chartContainer}>
          <h3>Attendance Trends (Last 7 Days)</h3>
          <p className={styles.emptyChart}>No chart data available</p>
        </div>
      );
    }

    const maxClockIn = Math.max(...chartData.map(d => d.clock_in || 0), 1);
    const maxClockOut = Math.max(...chartData.map(d => d.clock_out || 0), 1);

    return (
      <div className={styles.chartContainer}>
        <h3>Attendance Trends (Last 7 Days)</h3>
        <div className={styles.chart}>
          <div className={styles.chartBars}>
            {chartData.map((day) => (
              <div key={day.date} className={styles.chartBarGroup}>
                <div className={styles.chartBarLabel}>{day.date}</div>
                <div className={styles.chartBarsContainer}>
                  <div 
                    className={`${styles.chartBar} ${styles.clockIn}`}
                    style={{ height: `${((day.clock_in || 0) / maxClockIn) * 100}%` }}
                  />
                  <div 
                    className={`${styles.chartBar} ${styles.clockOut}`}
                    style={{ height: `${((day.clock_out || 0) / maxClockOut) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendColor} ${styles.clockIn}`} />
              Clock Ins
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendColor} ${styles.clockOut}`} />
              Clock Outs
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={fetchData}
        >
          <RefreshIcon /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Welcome back, <span>{user?.username}</span></h1>
        <button 
          className={styles.refreshButton}
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshIcon /> {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </header>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <>
          <section className={styles.statsGrid}>
            <StatCard 
              title="Total Users" 
              value={stats?.total_users} 
              icon={<PeopleIcon />}
              trend="up"
            />
            <StatCard 
              title="Geofences" 
              value={stats?.total_geofences} 
              icon={<MapIcon />}
              trend="neutral"
            />
            <StatCard 
              title="Recent Attendances" 
              value={stats?.recent_attendances} 
              icon={<TimeIcon />}
              trend="up"
            />
            <StatCard 
              title="Pending Complaints" 
              value={stats?.pending_complaints} 
              icon={<ChatIcon />}
              trend="down"
            />
          </section>

          <section className={styles.mainContent}>
            <AttendanceChart />
            <QuickActions />
          </section>

          <section className={styles.activitySection}>
            <ActivityFeed 
              title="Recent Attendances"
              data={recentAttendances}
              type="attendance"
            />
            <ActivityFeed 
              title="Recent Complaints"
              data={recentComplaints}
              type="complaint"
            />
          </section>
          <br />
        </>
      )}
    </div>
  );
};

export default Dashboard;