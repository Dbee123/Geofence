import React, { useState, useEffect, useContext } from 'react';
import { AntDesign } from '@expo/vector-icons';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
// import { SafeAreaView } from 'react-native-safe-area-context';  
import { createComplaint, getComplaints } from '../../services/complaints';

export default function Complaints() {
    const { userToken: token, logout } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // New complaint form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await getComplaints(token);
      setComplaints(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const openDetailModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedComplaint(null);
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setSubject('');
    setMessage('');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSubject('');
    setMessage('');
  };

  const handleCreateComplaint = async () => {
    if (!subject.trim() || !message.trim()) return;
    
    try {
      const newComplaint = await createComplaint(token, { subject, message });
      setComplaints([newComplaint, ...complaints]);
      closeCreateModal();
    } catch (err) {
      alert(err.message || 'Failed to create complaint');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return styles.statusResolved;
      case 'rejected':
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  const renderComplaint = ({ item }) => (
    <TouchableOpacity
      style={styles.complaintCard}
      onPress={() => openDetailModal(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.complaintTitle}>{item.subject}</Text>
        <Text
          style={[
            styles.status,
            getStatusColor(item.status),
          ]}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      <Text style={styles.complaintDate}>{formatDate(item.created_at)}</Text>
      <Text numberOfLines={2} style={styles.complaintDesc}>
        {item.message}
      </Text>
      {item.admin_response && (
        <View style={styles.adminResponseContainer}>
          <Text style={styles.adminResponseLabel}>Admin Response:</Text>
          <Text numberOfLines={2} style={styles.adminResponseText}>
            {item.admin_response}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchComplaints} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* <Text style={styles.header}>Complaints</Text> */}
      
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderComplaint}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No complaints found.</Text>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.closeBtn} onPress={closeDetailModal}>
              <AntDesign name="closecircle" size={24} color="#888" />
            </Pressable>
            {selectedComplaint && (
              <>
                <Text style={styles.modalTitle}>{selectedComplaint.subject}</Text>
                <Text style={styles.modalDate}>{formatDate(selectedComplaint.created_at)}</Text>
                <Text style={[styles.modalStatus, getStatusColor(selectedComplaint.status)]}>
                  Status: {selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}
                </Text>
                <Text style={styles.sectionTitle}>Your Message:</Text>
                <Text style={styles.modalDesc}>{selectedComplaint.message}</Text>
                
                {selectedComplaint.admin_response && (
                  <>
                    <Text style={styles.sectionTitle}>Admin Response:</Text>
                    <Text style={styles.adminResponseText}>
                      {selectedComplaint.admin_response}
                    </Text>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.closeBtn} onPress={closeCreateModal}>
              <AntDesign name="closecircle" size={24} color="#888" />
            </Pressable>
            <Text style={styles.modalTitle}>New Complaint</Text>
            <TextInput
              style={styles.input}
              placeholder="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Describe your issue in detail"
              value={message}
              onChangeText={setMessage}
              multiline
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!subject.trim() || !message.trim()) && styles.submitBtnDisabled,
              ]}
              onPress={handleCreateComplaint}
              disabled={!subject.trim() || !message.trim()}
            >
              <Text style={styles.submitBtnText}>Submit Complaint</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Button */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <AntDesign name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 10,
    alignSelf: 'center',
    color: '#222',
    letterSpacing: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  complaintCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complaintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  status: {
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusPending: {
    backgroundColor: '#ffe5b4',
    color: '#b26a00',
  },
  statusResolved: {
    backgroundColor: '#d4f8e8',
    color: '#1a7f37',
  },
  statusRejected: {
    backgroundColor: '#ffd8d8',
    color: '#d32f2f',
  },
  complaintDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 6,
  },
  complaintDesc: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
  },
  adminResponseContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  adminResponseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  adminResponseText: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    color: '#d32f2f',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    backgroundColor: '#3b82f6',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
    maxHeight: '80%',
  },
  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#222',
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalStatus: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
    color: '#222',
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});