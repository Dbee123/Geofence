import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  GoogleMap, 
  Marker, 
  Circle,
  useJsApiLoader,
  InfoWindow
} from '@react-google-maps/api';
import styles from './GeofenceManagement.module.css';
import { 
  getGeofences, 
  getGeofenceDetails, 
  createGeofence, 
  updateGeofence, 
  deleteGeofence 
} from '../../api';
import { 
  FiMapPin, 
  FiPlus, 
  FiX, 
  FiEdit2, 
  FiTrash2, 
  FiLoader,
  FiMap,
  FiSearch,
  FiFilter,
  FiEye,
  FiSettings,
  FiTarget,
  FiAlertCircle
} from 'react-icons/fi';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

// Predefined color schemes for geofences
const GEOFENCE_COLORS = [
  { primary: '#3B82F6', secondary: '#EFF6FF', name: 'Blue' },
  { primary: '#10B981', secondary: '#ECFDF5', name: 'Green' },
  { primary: '#F59E0B', secondary: '#FFFBEB', name: 'Amber' },
  { primary: '#EF4444', secondary: '#FEF2F2', name: 'Red' },
  { primary: '#8B5CF6', secondary: '#F5F3FF', name: 'Purple' },
  { primary: '#06B6D4', secondary: '#ECFEFF', name: 'Cyan' },
  { primary: '#F97316', secondary: '#FFF7ED', name: 'Orange' },
  { primary: '#EC4899', secondary: '#FDF2F8', name: 'Pink' }
];

const GeofenceManagement = () => {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [geofenceDetails, setGeofenceDetails] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRadius, setFilterRadius] = useState('all');
  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(10);
  const [showGeofenceList, setShowGeofenceList] = useState(true);
  const [hoveredGeofence, setHoveredGeofence] = useState(null);
  
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    radius: 100,
    description: '',
    color: 0
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  // Filtered geofences based on search and filter criteria
  const filteredGeofences = useMemo(() => {
    return geofences.filter(geofence => {
      const matchesSearch = geofence.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRadius = filterRadius === 'all' || 
        (filterRadius === 'small' && geofence.radius <= 100) ||
        (filterRadius === 'medium' && geofence.radius > 100 && geofence.radius <= 500) ||
        (filterRadius === 'large' && geofence.radius > 500);
      
      return matchesSearch && matchesRadius;
    });
  }, [geofences, searchTerm, filterRadius]);

  // Fetch all geofences
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        setLoading(true);
        const response = await getGeofences();
        const geofencesWithColors = response.data.geofences.map((geofence, index) => ({
          ...geofence,
          colorIndex: index % GEOFENCE_COLORS.length
        }));
        setGeofences(geofencesWithColors);
        
        // Set initial map center based on geofences
        if (geofencesWithColors.length > 0) {
          const avgLat = geofencesWithColors.reduce((sum, g) => sum + parseFloat(g.latitude), 0) / geofencesWithColors.length;
          const avgLng = geofencesWithColors.reduce((sum, g) => sum + parseFloat(g.longitude), 0) / geofencesWithColors.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
        }
      } catch (error) {
        toast.error('Failed to fetch geofences');
        console.error('Error fetching geofences:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGeofences();
  }, []);

  // Fetch geofence details when selected
  useEffect(() => {
    if (selectedGeofence) {
      const fetchGeofenceData = async () => {
        try {
          const loadingToast = toast.loading('Loading geofence details...');
          const response = await getGeofenceDetails(selectedGeofence);
          setGeofenceDetails(response.data);
          
          if (map) {
            const lat = parseFloat(response.data.latitude);
            const lng = parseFloat(response.data.longitude);
            map.panTo({ lat, lng });
            map.setZoom(16);
          }
          
          toast.dismiss(loadingToast);
        } catch (error) {
          toast.error('Failed to load geofence details');
          console.error('Error fetching geofence details:', error);
        }
      };
      fetchGeofenceData();
    }
  }, [selectedGeofence, map]);

  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onMapClick = useCallback((e) => {
    if (!showAddModal) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setNewGeofence(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  }, [showAddModal]);

  const handleGeofenceClick = (geofenceId) => {
    setSelectedGeofence(geofenceId);
  };

  const handleGeofenceHover = (geofenceId) => {
    setHoveredGeofence(geofenceId);
  };

  const handleCloseModal = () => {
    setSelectedGeofence(null);
    setGeofenceDetails(null);
    setShowAddModal(false);
    setShowDeleteConfirm(false);
    setNewGeofence({
      name: '',
      latitude: 0,
      longitude: 0,
      radius: 100,
      description: '',
      color: 0
    });
  };

  const handleUpdateGeofence = async () => {
    if (!geofenceDetails || !selectedGeofence) return;
    
    try {
      const updateData = {
        ...geofenceDetails,
        latitude: parseFloat(geofenceDetails.latitude),
        longitude: parseFloat(geofenceDetails.longitude),
        radius: parseFloat(geofenceDetails.radius)
      };
      
      await updateGeofence(selectedGeofence, updateData);
      toast.success('Geofence updated successfully');
      
      // Refresh geofences list
      const response = await getGeofences();
      const geofencesWithColors = response.data.geofences.map((geofence, index) => ({
        ...geofence,
        colorIndex: index % GEOFENCE_COLORS.length
      }));
      setGeofences(geofencesWithColors);
      
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to update geofence');
      console.error('Error updating geofence:', error);
    }
  };

  const handleDeleteGeofence = async () => {
    if (!selectedGeofence) return;
    
    try {
      await deleteGeofence(selectedGeofence);
      toast.success('Geofence deleted successfully');
      
      // Refresh geofences list
      const response = await getGeofences();
      const geofencesWithColors = response.data.geofences.map((geofence, index) => ({
        ...geofence,
        colorIndex: index % GEOFENCE_COLORS.length
      }));
      setGeofences(geofencesWithColors);
      
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to delete geofence');
      console.error('Error deleting geofence:', error);
    }
  };

  const handleAddGeofence = async () => {
    if (!newGeofence.name || !newGeofence.latitude || !newGeofence.longitude) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const geofenceData = {
        ...newGeofence,
        latitude: parseFloat(newGeofence.latitude),
        longitude: parseFloat(newGeofence.longitude),
        radius: parseFloat(newGeofence.radius)
      };
      
      await createGeofence(geofenceData);
      toast.success('Geofence added successfully');
      
      // Refresh geofences list
      const response = await getGeofences();
      const geofencesWithColors = response.data.geofences.map((geofence, index) => ({
        ...geofence,
        colorIndex: index % GEOFENCE_COLORS.length
      }));
      setGeofences(geofencesWithColors);
      
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to add geofence');
      console.error('Error adding geofence:', error);
    }
  };

  const getGeofenceColor = (geofence) => {
    const colorIndex = geofence.colorIndex || 0;
    return GEOFENCE_COLORS[colorIndex];
  };

  const fitMapToGeofences = () => {
    if (!map || filteredGeofences.length === 0) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    filteredGeofences.forEach(geofence => {
      bounds.extend({
        lat: parseFloat(geofence.latitude),
        lng: parseFloat(geofence.longitude)
      });
    });
    map.fitBounds(bounds);
  };

  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <FiLoader className={styles.spinIcon} />
          <p>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleSection}>
            <FiMap className={styles.titleIcon} />
            <h1 className={styles.title}>Geofence Management</h1>
            <span className={styles.geofenceCount}>{filteredGeofences.length} geofences</span>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.fitButton}
            onClick={fitMapToGeofences}
            title="Fit all geofences"
          >
            <FiTarget />
          </button>
          
          <button 
            className={styles.toggleListButton}
            onClick={() => setShowGeofenceList(!showGeofenceList)}
            title="Toggle geofence list"
          >
            <FiEye />
          </button>
          
          <button 
            className={styles.addButton} 
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus />
            <span>Add Geofence</span>
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        {showGeofenceList && (
          <div className={styles.sidebar}>
            {/* Search and Filter */}
            <div className={styles.searchSection}>
              <div className={styles.searchContainer}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search geofences..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              
              <div className={styles.filterContainer}>
                <FiFilter className={styles.filterIcon} />
                <select
                  value={filterRadius}
                  onChange={(e) => setFilterRadius(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (≤100m)</option>
                  <option value="medium">Medium (100-500m)</option>
                  <option value="large">Large ({'>'}500m)</option>
                </select>
              </div>
            </div>

            {/* Geofences List */}
            <div className={styles.geofencesList}>
              {loading ? (
                <div className={styles.loadingState}>
                  <FiLoader className={styles.spinIcon} />
                  <p>Loading geofences...</p>
                </div>
              ) : filteredGeofences.length === 0 ? (
                <div className={styles.emptyState}>
                  <FiMapPin className={styles.emptyIcon} />
                  <h3>No geofences found</h3>
                  <p>Create your first geofence to get started</p>
                  <button 
                    className={styles.emptyStateButton}
                    onClick={() => setShowAddModal(true)}
                  >
                    <FiPlus />
                    Add Geofence
                  </button>
                </div>
              ) : (
                filteredGeofences.map((geofence) => {
                  const color = getGeofenceColor(geofence);
                  const isSelected = selectedGeofence === geofence.id;
                  const isHovered = hoveredGeofence === geofence.id;
                  
                  return (
                    <div 
                      key={geofence.id} 
                      className={`${styles.geofenceCard} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''}`}
                      onClick={() => handleGeofenceClick(geofence.id)}
                      onMouseEnter={() => handleGeofenceHover(geofence.id)}
                      onMouseLeave={() => setHoveredGeofence(null)}
                    >
                      <div className={styles.cardHeader}>
                        <div 
                          className={styles.colorIndicator}
                          style={{ backgroundColor: color.primary }}
                        />
                        <div className={styles.cardTitle}>
                          <h3>{geofence.name}</h3>
                          <span className={styles.cardId}>#{geofence.id}</span>
                        </div>
                      </div>
                      
                      <div className={styles.cardContent}>
                        <div className={styles.cardDetail}>
                          <span className={styles.cardLabel}>Location</span>
                          <span className={styles.cardValue}>
                            {parseFloat(geofence.latitude).toFixed(4)}, {parseFloat(geofence.longitude).toFixed(4)}
                          </span>
                        </div>
                        
                        <div className={styles.cardDetail}>
                          <span className={styles.cardLabel}>Radius</span>
                          <span className={styles.cardValue}>{geofence.radius}m</span>
                        </div>
                        
                        <div className={styles.cardDetail}>
                          <span className={styles.cardLabel}>Created</span>
                          <span className={styles.cardValue}>
                            {new Date(geofence.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className={styles.cardActions}>
                          <button 
                            className={styles.cardActionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Edit functionality
                            }}
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            className={`${styles.cardActionButton} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className={styles.mapContainer}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            onClick={onMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            {filteredGeofences.map((geofence) => {
              const color = getGeofenceColor(geofence);
              const isSelected = selectedGeofence === geofence.id;
              const isHovered = hoveredGeofence === geofence.id;
              const position = {
                lat: parseFloat(geofence.latitude),
                lng: parseFloat(geofence.longitude)
              };

              return (
                <React.Fragment key={geofence.id}>
                  {/* Geofence Circle */}
                  <Circle
                    center={position}
                    radius={parseFloat(geofence.radius)}
                    options={{
                      strokeColor: color.primary,
                      strokeOpacity: isSelected ? 1 : isHovered ? 0.9 : 0.7,
                      strokeWeight: isSelected ? 3 : isHovered ? 2.5 : 2,
                      fillColor: color.primary,
                      fillOpacity: isSelected ? 0.25 : isHovered ? 0.2 : 0.15,
                      zIndex: isSelected ? 1000 : isHovered ? 999 : 1
                    }}
                    onClick={() => handleGeofenceClick(geofence.id)}
                    onMouseOver={() => handleGeofenceHover(geofence.id)}
                    onMouseOut={() => setHoveredGeofence(null)}
                  />
                  
                  {/* Center Marker */}
                  <Marker
                    position={position}
                    onClick={() => handleGeofenceClick(geofence.id)}
                    onMouseOver={() => handleGeofenceHover(geofence.id)}
                    onMouseOut={() => setHoveredGeofence(null)}
                    icon={{
                      path: 'M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z',
                      fillColor: color.primary,
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                      scale: isSelected ? 1.3 : isHovered ? 1.1 : 1,
                      anchor: new window.google.maps.Point(12, 22)
                    }}
                    zIndex={isSelected ? 1001 : isHovered ? 1000 : 999}
                  />

                  {/* Info Window for hovered geofence */}
                  {(isHovered || isSelected) && (
                    <InfoWindow
                      position={position}
                      options={{
                        pixelOffset: new window.google.maps.Size(0, -35)
                      }}
                    >
                      <div className={styles.infoWindow}>
                        <h4>{geofence.name}</h4>
                        <p>Radius: {geofence.radius}m</p>
                        <small>{parseFloat(geofence.latitude).toFixed(4)}, {parseFloat(geofence.longitude).toFixed(4)}</small>
                      </div>
                    </InfoWindow>
                  )}
                </React.Fragment>
              );
            })}

            {/* New geofence preview when adding */}
            {showAddModal && newGeofence.latitude !== 0 && newGeofence.longitude !== 0 && (
              <>
                <Marker
                  position={{
                    lat: newGeofence.latitude,
                    lng: newGeofence.longitude
                  }}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z',
                    fillColor: GEOFENCE_COLORS[newGeofence.color].primary,
                    fillOpacity: 0.8,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 1.2,
                    anchor: new window.google.maps.Point(12, 22)
                  }}
                />
                <Circle
                  center={{
                    lat: newGeofence.latitude,
                    lng: newGeofence.longitude
                  }}
                  radius={newGeofence.radius}
                  options={{
                    strokeColor: GEOFENCE_COLORS[newGeofence.color].primary,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: GEOFENCE_COLORS[newGeofence.color].primary,
                    fillOpacity: 0.2,
                    strokeDashArray: '5,5'
                  }}
                />
              </>
            )}
          </GoogleMap>
        </div>
      </div>

      {/* Geofence Details Modal */}
      {selectedGeofence && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <FiSettings />
                <h2>Geofence Details</h2>
              </div>
              <button className={styles.modalClose} onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {!geofenceDetails ? (
                <div className={styles.modalLoading}>
                  <FiLoader className={styles.spinIcon} />
                  <p>Loading details...</p>
                </div>
              ) : (
                <div className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Name *</label>
                      <input
                        type="text"
                        value={geofenceDetails.name || ''}
                        onChange={(e) => setGeofenceDetails({...geofenceDetails, name: e.target.value})}
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Latitude *</label>
                      <input
                        type="number"
                        value={geofenceDetails.latitude || 0}
                        onChange={(e) => setGeofenceDetails({...geofenceDetails, latitude: parseFloat(e.target.value)})}
                        className={styles.formInput}
                        step="0.000001"
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Longitude *</label>
                      <input
                        type="number"
                        value={geofenceDetails.longitude || 0}
                        onChange={(e) => setGeofenceDetails({...geofenceDetails, longitude: parseFloat(e.target.value)})}
                        className={styles.formInput}
                        step="0.000001"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Radius (meters) *</label>
                      <input
                        type="number"
                        value={geofenceDetails.radius || 100}
                        onChange={(e) => setGeofenceDetails({...geofenceDetails, radius: parseFloat(e.target.value)})}
                        className={styles.formInput}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Created At</label>
                      <div className={styles.formValue}>
                        {new Date(geofenceDetails.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {showDeleteConfirm ? (
                <>
                  <p className={styles.deleteWarning}>
                    <FiAlertCircle />
                    Are you sure you want to delete this geofence? This action cannot be undone.
                  </p>
                  <div className={styles.modalActions}>
                    <button 
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className={`${styles.button} ${styles.buttonDanger}`}
                      onClick={handleDeleteGeofence}
                    >
                      <FiTrash2 />
                      Delete Geofence
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.modalActions}>
                  <button 
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                  <button 
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <FiTrash2 />
                    Delete
                  </button>
                  <button 
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={handleUpdateGeofence}
                    disabled={!geofenceDetails}
                  >
                    <FiEdit2 />
                    Update Geofence
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Geofence Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className={`${styles.modal} ${styles.addModal}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <FiPlus />
                <h2>Add New Geofence</h2>
              </div>
              <button className={styles.modalClose} onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name *</label>
                    <input
                      type="text"
                      value={newGeofence.name}
                      onChange={(e) => setNewGeofence({...newGeofence, name: e.target.value})}
                      className={styles.formInput}
                      placeholder="Enter geofence name"
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description</label>
                    <textarea
                      value={newGeofence.description}
                      onChange={(e) => setNewGeofence({...newGeofence, description: e.target.value})}
                      className={styles.formTextarea}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Color</label>
                    <div className={styles.colorPicker}>
                      {GEOFENCE_COLORS.map((color, index) => (
                        <button
                          key={index}
                          className={`${styles.colorOption} ${newGeofence.color === index ? styles.selected : ''}`}
                          style={{ backgroundColor: color.primary }}
                          onClick={() => setNewGeofence({...newGeofence, color: index})}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className={styles.mapInstruction}>
                  <FiMapPin />
                  <span>Click on the map below to set the geofence location</span>
                </div>
                
                <div className={styles.formMapContainer}>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '300px' }}
                    center={newGeofence.latitude !== 0 && newGeofence.longitude !== 0 
                      ? { lat: newGeofence.latitude, lng: newGeofence.longitude }
                      : mapCenter
                    }
                    zoom={12}
                    onClick={onMapClick}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      zoomControl: true,
                    }}
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Latitude *</label>
                    <input
                      type="number"
                      value={newGeofence.latitude || 0}
                      onChange={(e) => setNewGeofence({...newGeofence, latitude: parseFloat(e.target.value) || 0})}
                      className={styles.formInput}
                      step="0.000001"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Longitude *</label>
                    <input
                      type="number"
                      value={newGeofence.longitude || 0}
                      onChange={(e) => setNewGeofence({...newGeofence, longitude: parseFloat(e.target.value) || 0})}
                      className={styles.formInput}
                      step="0.000001"
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Radius (meters) *</label>
                    <input
                      type="number"
                      value={newGeofence.radius || 100}
                      onChange={(e) => setNewGeofence({...newGeofence, radius: parseInt(e.target.value) || 100})}
                      className={styles.formInput}
                      min="1"
                      max="10000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button 
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button 
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleAddGeofence}
                  disabled={!newGeofence.name || !newGeofence.latitude || !newGeofence.longitude}
                >
                  <FiPlus />
                  Add Geofence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofenceManagement;