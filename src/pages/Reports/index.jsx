import React, { useState, useEffect } from 'react';
import styles from './Reports.module.css';
import { 
  getSystemStats,
  getAttendanceReport,
  getLoginLogs,
  getAttendances,
  getUserDetails
} from '../../api';
import { format, parseISO, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import UserManagement from './UserManagement';


const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAttendances, setUserAttendances] = useState([]);
  const [activeTab, setActiveTab] = useState('attendances');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const [statsRes, attendanceRes, logsRes] = await Promise.all([
        getSystemStats(),
        getAttendanceReport({ 
          start_date: dateRange.start,
          end_date: dateRange.end
        }),
        getLoginLogs({
          date_from: dateRange.start,
          date_to: dateRange.end
        })
      ]);
      
      setStats(statsRes.data);
      setAttendanceReport(attendanceRes.data);
      console.log(logsRes.data);
      
      setLoginLogs(logsRes.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (logEntry) => {
  try {
    // Use the user details from the log entry
    const userDetails = logEntry.user_details || logEntry.user;
    
    // Get attendances for this specific user only
    const attendancesRes = await getAttendances({ user_id: userDetails.id });
    
    setSelectedUser({
      ...userDetails,
      attendances: attendancesRes.data.filter(att => att.user === userDetails.id)
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
  }
};

  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading reports...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>System Reports</h1>
        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>From:</label>
            <input
              type="date"
              name="start"
              className={styles.filterInput}
              value={dateRange.start}
              onChange={handleDateChange}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>To:</label>
            <input
              type="date"
              name="end"
              className={styles.filterInput}
              value={dateRange.end}
              onChange={handleDateChange}
            />
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className={styles.dashboard}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Total Users</h3>
          <div className={styles.cardValue}>{stats?.total_users}</div>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Active Logins</h3>
          <div className={styles.cardValue}>{stats?.active_logins}</div>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Pending Complaints</h3>
          <div className={styles.cardValue}>{stats?.pending_complaints}</div>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Recent Attendances</h3>
          <div className={styles.cardValue}>{stats?.recent_attendances}</div>
          <div className={styles.cardSecondary}>Last 30 days</div>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Recent Logins</h3>
          <div className={styles.cardValue}>{stats?.recent_logins}</div>
          <div className={styles.cardSecondary}>Last 30 days</div>
        </div>
      </div>

      {/* Attendance Chart */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Attendance Overview</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceReport}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="clock_in" 
                stroke="#3182ce" 
                name="Clock Ins"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="clock_out" 
                stroke="#38a169" 
                name="Clock Outs"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Login Logs Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Login Activity</h2>
        <div className={styles.tableContainer}>
          {loginLogs.length === 0 ? (
            <div className={styles.emptyState}>No login activity found for the selected period</div>
          ) : (
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={styles.tableHeaderCell}>User</th>
                  <th className={styles.tableHeaderCell}>Login Time</th>
                  
                  <th className={styles.tableHeaderCell}>IP Address</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.map((log) => (
                  <tr key={log.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <span 
                        className={styles.userLink}
                        onClick={() => handleUserClick(log)}
                      >
                        {log.user_details.username}
                      </span>
                    </td>
                    <td className={styles.tableCell}>{formatDate(log.login_time)}</td>
                    
                    <td className={styles.tableCell}>{log.ip_address || 'N/A'}</td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${
                        log.login_time ? styles.success : styles.error
                      }`}>
                        {log.login_time ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>User Activity Details</h2>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedUser(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className={styles.userDetails}>
              <div className={styles.userAvatar}>
                {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
              </div>
              <div className={styles.userInfo}>
                <h3 className={styles.userName}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <span className={styles.userRole}>{selectedUser.role}</span>
              </div>
            </div>

            <div className={styles.userStats}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{selectedUser.attendances?.length || 0}</div>
                <div className={styles.statLabel}>Total Attendances</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {selectedUser.attendances?.filter(a => a.type === 'clock-in').length || 0}
                </div>
                <div className={styles.statLabel}>Clock Ins</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {selectedUser.attendances?.filter(a => a.type === 'clock-out').length || 0}
                </div>
                <div className={styles.statLabel}>Clock Outs</div>
              </div>
            </div>

            <div className={styles.tabContainer}>
              <div className={styles.tabs}>
                <div 
                  className={`${styles.tab} ${activeTab === 'attendances' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('attendances')}
                >
                  Attendances
                </div>
                <div 
                  className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  User Details
                </div>
              </div>
              <div className={styles.tabContent}>
                {activeTab === 'attendances' ? (
                  selectedUser.attendances?.length > 0 ? (
                    <table className={styles.table}>
                      <thead className={styles.tableHeader}>
                        <tr>
                          <th className={styles.tableHeaderCell}>Type</th>
                          <th className={styles.tableHeaderCell}>Time</th>
                          <th className={styles.tableHeaderCell}>Geofence</th>
                          <th className={styles.tableHeaderCell}>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.attendances.map((attendance) => (
                          <tr key={attendance.id} className={styles.tableRow}>
                            <td className={styles.tableCell}>
                              <span className={`${styles.statusBadge} ${
                                attendance.type === 'clock-in' ? styles.success : styles.warning
                              }`}>
                                {attendance.type}
                              </span>
                            </td>
                            <td className={styles.tableCell}>
                              {formatDate(attendance.timestamp)}
                            </td>
                            <td className={styles.tableCell}>
                              {attendance.geofence_details?.name || 'N/A'}
                            </td>
                            <td className={styles.tableCell}>
                              {attendance.latitude.toFixed(4)}, {attendance.longitude.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyState}>No attendance records found</div>
                  )
                ) : (
                  <div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Username</div>
                      <div className={styles.detailValue}>{selectedUser.username}</div>
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Email</div>
                      <div className={styles.detailValue}>{selectedUser.email || 'N/A'}</div>
                    </div>
                    {/* <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Last Login</div>
                      <div className={styles.detailValue}>
                        {selectedUser.last_login ? formatDate(selectedUser.last_login) : 'N/A'}
                      </div>
                    </div> */}
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Date Joined</div>
                      <div className={styles.detailValue}>
                        {formatDate(selectedUser.date_joined)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      <UserManagement />
    </div>
  );
};

export default Reports;