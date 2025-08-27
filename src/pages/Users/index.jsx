import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './UserManagement.module.css';
import { getUsers, getUserDetails, updateUser, deleteUser, getAttendances, registerUser } from '../../api';
import { FiUser, FiUserPlus, FiX, FiClock, FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';

const index = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [userAttendances, setUserAttendances] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'employee',
    is_active: true
  });

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response.data.users);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch users');
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch user details when a user is selected
  useEffect(() => {
    if (selectedUser) {
      const fetchUserData = async () => {
        try {
          toast.info('Loading user details...', { toastId: 'loading-user' });
          const detailsResponse = await getUserDetails(selectedUser);
          setUserDetails(detailsResponse.data);
          
          const attendanceResponse = await getAttendances({ user: selectedUser });
          setUserAttendances(attendanceResponse.data);
          
          toast.dismiss('loading-user');
        } catch (error) {
          toast.error('Failed to load user details');
          toast.dismiss('loading-user');
        }
      };
      fetchUserData();
    }
  }, [selectedUser]);

  const handleUserClick = (userId) => {
    setSelectedUser(userId);
    setUserDetails(null);
    setUserAttendances([]);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setUserDetails(null);
    setUserAttendances([]);
  };

  const handleUpdateUser = async () => {
    try {
      await updateUser(selectedUser, userDetails);
      toast.success('User updated successfully');
      // Refresh user list
      const response = await getUsers();
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(selectedUser);
      toast.success('User deleted successfully');
      handleCloseModal();
      // Refresh user list
      const response = await getUsers();
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleAddUser = async () => {
    try {
      await registerUser(newUser);
      toast.success('User added successfully');
      setShowAddModal(false);
      // Refresh user list
      const response = await getUsers();
      setUsers(response.data.users);
      // Reset form
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'employee',
        is_active: true
      });
    } catch (error) {
      toast.error('Failed to add user');
      console.error('Add user error:', error);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return styles.adminBadge;
      case 'manager':
        return styles.managerBadge;
      default:
        return styles.employeeBadge;
    }
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive ? styles.activeBadge : styles.inactiveBadge;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
          <FiUserPlus /> Add User
        </button>
      </div>

      

      {loading ? (
  <div className={styles.loadingSpinner}>
    <div className={styles.spinner}></div>
  </div>
) : users.length === 0 ? (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>
      <FiUser size={48} />
    </div>
    <p>No users found</p>
  </div>
) : (
  <>
    {/* Desktop Table View (hidden on mobile) */}
    <div className={styles.tableWrapper}>
      <table className={styles.usersTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={styles.userRow} onClick={() => handleUserClick(user.id)}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(user.is_active)}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{new Date(user.date_joined).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile Card View (hidden on desktop) */}
    <div className={styles.mobileUserList}>
      {users.map((user) => (
        <div key={user.id} className={styles.mobileUserCard} onClick={() => handleUserClick(user.id)}>
          <div className={styles.mobileUserHeader}>
            <div className={styles.mobileUserName}>
              {user.first_name} {user.last_name}
            </div>
            <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
              {user.role}
            </span>
          </div>
          <div className={styles.mobileUserDetails}>
            <div className={styles.mobileDetailItem}>
              <span className={styles.mobileDetailLabel}>Username</span>
              <span className={styles.mobileDetailValue}>{user.username}</span>
            </div>
            <div className={styles.mobileDetailItem}>
              <span className={styles.mobileDetailLabel}>Status</span>
              <span className={`${styles.statusBadge} ${getStatusBadgeClass(user.is_active)}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className={styles.mobileDetailItem}>
              <span className={styles.mobileDetailLabel}>Email</span>
              <span className={styles.mobileDetailValue}>{user.email}</span>
            </div>
            <div className={styles.mobileDetailItem}>
              <span className={styles.mobileDetailLabel}>Joined</span>
              <span className={styles.mobileDetailValue}>
                {new Date(user.date_joined).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
)}
      {/* User Details Modal */}
      {selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>User Details</h2>
              <button className={styles.modalClose} onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {!userDetails ? (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinner}></div>
                </div>
              ) : (
                <>
                  <div className={styles.userDetailsGrid}>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Username</div>
                      <div className={styles.detailValue}>{userDetails.username}</div>
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Email</div>
                      <div className={styles.detailValue}>{userDetails.email}</div>
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>First Name</div>
                      <div className={styles.detailValue}>
                        <input
                          type="text"
                          value={userDetails.first_name || ''}
                          onChange={(e) => setUserDetails({...userDetails, first_name: e.target.value})}
                          className={styles.formInput}
                        />
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Last Name</div>
                      <div className={styles.detailValue}>
                        <input
                          type="text"
                          value={userDetails.last_name || ''}
                          onChange={(e) => setUserDetails({...userDetails, last_name: e.target.value})}
                          className={styles.formInput}
                        />
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Role</div>
                      <div className={styles.detailValue}>
                        <select
                          value={userDetails.role}
                          onChange={(e) => setUserDetails({...userDetails, role: e.target.value})}
                          className={styles.formSelect}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Status</div>
                      <div className={styles.detailValue}>
                        <select
                          value={userDetails.is_active ? 'true' : 'false'}
                          onChange={(e) => setUserDetails({...userDetails, is_active: e.target.value === 'true'})}
                          className={styles.formSelect}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Last Login</div>
                      <div className={styles.detailValue}>
                        {userDetails.last_login ? new Date(userDetails.last_login).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Date Joined</div>
                      <div className={styles.detailValue}>
                        {new Date(userDetails.date_joined).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* <div className={styles.attendanceSection}>
                    <h3 className={styles.attendanceTitle}>
                      <FiClock /> Attendance Records
                    </h3>
                    {userAttendances.length === 0 ? (
                      <p>No attendance records found</p>
                    ) : (
                      <table className={styles.attendanceTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userAttendances.map((attendance) => (
                            <tr key={attendance.id}>
                              <td>{new Date(attendance.date).toLocaleDateString()}</td>
                              <td>{attendance.clock_in ? new Date(attendance.clock_in).toLocaleTimeString() : '-'}</td>
                              <td>{attendance.clock_out ? new Date(attendance.clock_out).toLocaleTimeString() : '-'}</td>
                              <td>{attendance.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div> */}
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              {showDeleteConfirm ? (
                <>
                  <button 
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.dangerButton}`}
                    onClick={handleDeleteUser}
                  >
                    <FiTrash2 /> Confirm Delete
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.dangerButton}`}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <FiTrash2 /> Delete User
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.primaryButton}`}
                    onClick={handleUpdateUser}
                    disabled={!userDetails}
                  >
                    <FiEdit2 /> Update User
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New User</h2>
              <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>
                <FiX />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter username"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter email"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Password</label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter password"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>First Name</label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter first name"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Last Name</label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter last name"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className={styles.formSelect}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select
                  value={newUser.is_active ? 'true' : 'false'}
                  onChange={(e) => setNewUser({...newUser, is_active: e.target.value === 'true'})}
                  className={styles.formSelect}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={`${styles.actionButton} ${styles.secondaryButton}`}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`${styles.actionButton} ${styles.primaryButton}`}
                onClick={handleAddUser}
                disabled={!newUser.username || !newUser.password}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;