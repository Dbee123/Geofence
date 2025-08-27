// UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { getUsers, getUserActivity } from '../../api';
import { format, parseISO } from 'date-fns';
import styles from './UserManagement.module.css';

const UserManagement = () => {
  const [usersData, setUsersData] = useState({ total: 0, users: [] });
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [activeTab, setActiveTab] = useState('attendances');

  // Debug logs
  console.log('Current state:', {
    selectedUserId,
    userActivity,
    activityLoading,
    usersData
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers();
        console.log('Users API response:', response.data);
        setUsersData({
          total: response.data?.total || 0,
          users: Array.isArray(response.data?.users) ? response.data.users : []
        });
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setUsersData({ total: 0, users: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchUserActivity = async () => {
      if (!selectedUserId) {
        setUserActivity(null);
        return;
      }

      try {
        setActivityLoading(true);
        console.log('Fetching activity for user:', selectedUserId);
        const response = await getUserActivity(selectedUserId);
        console.log('Activity API response:', response.data);
        setUserActivity(response.data || null);
      } catch (err) {
        console.error('Error fetching user activity:', err);
        setError('Failed to load user activity');
        setUserActivity(null);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchUserActivity();
  }, [selectedUserId]);

  const handleUserClick = (userId) => {
    console.log('User clicked:', userId);
    setSelectedUserId(userId);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setSelectedUserId(null);
    setUserActivity(null);
  };

  const formatDate = (dateString) => {
    try {
      return dateString ? format(parseISO(dateString), 'MMM dd, yyyy HH:mm') : 'N/A';
    } catch {
      return dateString || 'N/A';
    }
  };

  const filteredUsers = usersData.users.filter(user => {
    if (!user) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.username?.toLowerCase().includes(searchLower) ||
      (user.email?.toLowerCase().includes(searchLower)) ||
      (`${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchLower))
    ));
  });

  if (error) {
    return <div className={styles.errorState}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Activity</h1>
        <div className={styles.headerControls}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search users..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.totalUsers}>
            Total: {usersData.total}
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading users...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.badge} ${
                      user.role === 'admin' ? styles.badgePrimary : styles.badgeSecondary
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${
                      user.is_active ? styles.badgeSuccess : styles.badgeError
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={styles.viewButton}
                      onClick={() => handleUserClick(user.id)}
                      disabled={activityLoading}
                    >
                      {activityLoading && selectedUserId === user.id ? 'Loading...' : 'View Activity'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className={styles.emptyState}>
              {searchTerm ? 'No users match your search' : 'No users found'}
            </div>
          )}
        </div>
      )}

      {/* User Activity Modal */}
      {selectedUserId && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            {activityLoading ? (
              <div className={styles.loadingState}>Loading user activity...</div>
            ) : userActivity ? (
              <>
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>
                    {userActivity.user?.first_name || 'User'} {userActivity.user?.last_name || ''}'s Activity
                  </h2>
                  <button 
                    className={styles.closeButton}
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>

                <div className={styles.userSummary}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                      {userActivity.attendances?.length || 0}
                    </div>
                    <div className={styles.summaryLabel}>Attendances</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                      {userActivity.login_logs?.length || 0}
                    </div>
                    <div className={styles.summaryLabel}>Login Logs</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                      {userActivity.complaints?.length || 0}
                    </div>
                    <div className={styles.summaryLabel}>Complaints</div>
                  </div>
                </div>

                <div className={styles.tabContainer}>
                  <div className={styles.tabs}>
                    <button
                      className={`${styles.tab} ${activeTab === 'attendances' ? styles.activeTab : ''}`}
                      onClick={() => setActiveTab('attendances')}
                    >
                      Attendances
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'logins' ? styles.activeTab : ''}`}
                      onClick={() => setActiveTab('logins')}
                    >
                      Login Logs
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'complaints' ? styles.activeTab : ''}`}
                      onClick={() => setActiveTab('complaints')}
                    >
                      Complaints
                    </button>
                  </div>

                  <div className={styles.tabContent}>
                    {activeTab === 'attendances' && renderAttendances()}
                    {activeTab === 'logins' && renderLoginLogs()}
                    {activeTab === 'complaints' && renderComplaints()}
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.errorState}>
                Failed to load user activity data
                <button onClick={closeModal} className={styles.retryButton}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function renderAttendances() {
    return (
      <div className={styles.activityTable}>
        {userActivity.attendances?.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Time</th>
                <th>Location</th>
                <th>Geofence</th>
              </tr>
            </thead>
            <tbody>
              {userActivity.attendances.map(att => (
                <tr key={att.id}>
                  <td>
                    <span className={`${styles.badge} ${
                      att.type === 'clock-in' ? styles.badgeSuccess : styles.badgeWarning
                    }`}>
                      {att.type}
                    </span>
                  </td>
                  <td>{formatDate(att.timestamp)}</td>
                  <td>
                    {att.latitude?.toFixed(4)}, {att.longitude?.toFixed(4)}
                  </td>
                  <td>{att.geofence_details?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>No attendance records found</div>
        )}
      </div>
    );
  }

  function renderLoginLogs() {
    return (
      <div className={styles.activityTable}>
        {userActivity.login_logs?.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Login Time</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {userActivity.login_logs.map(log => (
                <tr key={log.id}>
                  <td>{formatDate(log.login_time)}</td>
                  <td>{log.ip_address || 'N/A'}</td>
                  <td>{ log.user_agent || 'N/A' }</td>
                  <td>
                    <span className={`${styles.badge} ${
                      log.login_time ? styles.badgeSuccess : styles.badgeError
                    }`}>
                      {log.login_time ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>No login records found</div>
        )}
      </div>
    );
  }

  function renderComplaints() {
    return (
      <div className={styles.activityTable}>
        {userActivity.complaints?.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {userActivity.complaints.map(complaint => (
                <tr key={complaint.id}>
                  <td>{complaint.subject}</td>
                  <td>
                    <span className={`${styles.badge} ${
                      complaint.status === 'resolved' ? styles.badgeSuccess :
                      complaint.status === 'rejected' ? styles.badgeError : styles.badgeWarning
                    }`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td>{formatDate(complaint.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>No complaints found</div>
        )}
      </div>
    );
  }
};

export default UserManagement;