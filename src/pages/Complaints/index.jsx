import React, { useState, useEffect } from 'react';
import styles from './Complaints.module.css';
import { getComplaints, getComplaintDetails, updateComplaint } from '../../api';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
  try {
    setLoading(true);
    const response = await getComplaints();
    console.log('Full API response:', response); // Inspect the full response
    
    // Try these alternatives if response.data is empty:
    // setComplaints(response.data.results || response.data.data || response.data);
    setComplaints(response.data);
  } catch (error) {
    console.error('Error fetching complaints:', error);
  } finally {
    setLoading(false);
  }
};

  const handleComplaintClick = async (id) => {
    try {
      const response = await getComplaintDetails(id);
      setSelectedComplaint(response.data);
      setResponseText(response.data.admin_response || '');
      setSelectedStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching complaint details:', error);
    }
  };

  const handleSubmitResponse = async () => {
    if (selectedStatus === 'resolved' && !responseText.trim()) {
      alert('Admin response is required when resolving a complaint');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateComplaint(selectedComplaint.id, {
        admin_response: responseText,
        status: selectedStatus,
      });
      fetchComplaints(); // Refresh the list
      setSelectedComplaint(null); // Close the modal
    } catch (error) {
      console.error('Error updating complaint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return styles.pending;
      case 'resolved':
        return styles.resolved;
      case 'rejected':
        return styles.rejected;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Complaints Management</h1>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search complaints..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>Loading complaints...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className={styles.emptyState}>No complaints found matching your criteria</div>
        ) : (
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>ID</th>
                <th className={styles.tableHeaderCell}>User</th>
                <th className={styles.tableHeaderCell}>Subject</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Created At</th>
                <th className={styles.tableHeaderCell}>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  className={styles.tableRow}
                  onClick={() => handleComplaintClick(complaint.id)}
                >
                  <td className={styles.tableCell}>{complaint.id}</td>
                  <td className={styles.tableCell}>
                    {complaint.user_details?.username || 'Unknown User'}
                  </td>
                  <td className={styles.tableCell}>{complaint.subject}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className={styles.tableCell}>{formatDate(complaint.created_at)}</td>
                  <td className={styles.tableCell}>{formatDate(complaint.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedComplaint && (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>Complaint #{selectedComplaint.id}</h2>
        <button
          className={styles.closeButton}
          onClick={() => setSelectedComplaint(null)}
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      <div className={styles.complaintDetails}>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>User</div>
          <div className={styles.detailValue}>
            {selectedComplaint.user_details?.username || 'Unknown User'}
          </div>
        </div>

        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>Subject</div>
          <div className={styles.detailValue}>{selectedComplaint.subject}</div>
        </div>

        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>Message</div>
          <div className={styles.detailValue} style={{ whiteSpace: 'pre-wrap' }}>
            {selectedComplaint.message}
          </div>
        </div>

        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>Created At</div>
          <div className={styles.detailValue}>{formatDate(selectedComplaint.created_at)}</div>
        </div>

        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>Last Updated</div>
          <div className={styles.detailValue}>{formatDate(selectedComplaint.updated_at)}</div>
        </div>
      </div>

      <div className={styles.responseForm}>
        <label className={styles.responseLabel}>Admin Response</label>
        <textarea
          className={styles.responseTextarea}
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder="Type your response here..."
        />

        <div className={styles.statusRadioGroup}>
          <label 
            className={styles.statusRadioLabel}
            data-status="pending"
          >
            <input
              type="radio"
              className={styles.statusRadio}
              name="status"
              value="pending"
              checked={selectedStatus === 'pending'}
              onChange={() => setSelectedStatus('pending')}
            />
            <span className={styles.statusRadioLabelText}>Pending</span>
          </label>

          <label 
            className={styles.statusRadioLabel}
            data-status="resolved"
          >
            <input
              type="radio"
              className={styles.statusRadio}
              name="status"
              value="resolved"
              checked={selectedStatus === 'resolved'}
              onChange={() => setSelectedStatus('resolved')}
            />
            <span className={styles.statusRadioLabelText}>Resolved</span>
          </label>

          <label 
            className={styles.statusRadioLabel}
            data-status="rejected"
          >
            <input
              type="radio"
              className={styles.statusRadio}
              name="status"
              value="rejected"
              checked={selectedStatus === 'rejected'}
              onChange={() => setSelectedStatus('rejected')}
            />
            <span className={styles.statusRadioLabelText}>Rejected</span>
          </label>
        </div>

        <button
          className={styles.submitButton}
          onClick={handleSubmitResponse}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Submit Response'
          )}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Complaints;