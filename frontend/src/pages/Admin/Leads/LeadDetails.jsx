import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiMail, FiMapPin, FiEdit2, FiAlertCircle } from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import leadService from '../../../services/leadService';
import './LeadDetails.css';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLead = async () => {
      setIsLoading(true);
      try {
        const data = await leadService.getById(id);
        // Backend ka response check karo (kabhi kabhi data.data me aata hai)
        setLead(data.data || data); 
        setError('');
      } catch (err) {
        console.error("Error fetching lead:", err);
        setError('Lead not found. It may have been deleted.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  if (isLoading) return <Loader fullScreen text="Loading Lead Details..." />;

  if (error) {
    return (
      <div className="lead-details-page">
        <div className="error-card">
          <FiAlertCircle size={48} color="#e53e3e" />
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate('/admin/leads')}>
            Back to Leads List
          </Button>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  // Status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'status-new';
      case 'Contacted': return 'status-contacted';
      case 'Interested': return 'status-interested';
      case 'Converted': return 'status-converted';
      case 'Lost': return 'status-lost';
      default: return '';
    }
  };

  return (
    <div className="lead-details-page">
      {/* Top Bar */}
      <div className="details-top-bar">
        <button className="back-btn" onClick={() => navigate('/admin/leads')}>
          <FiArrowLeft /> Back to Leads
        </button>
        <Button variant="primary" icon={<FiEdit2 />} onClick={() => navigate('/admin/leads')}>
          Edit Lead
        </Button>
      </div>

      <div className="details-grid">
        {/* Left Column: Info Card */}
        <div className="info-card">
          <div className="profile-header">
            <div className="avatar-large">{lead.customer?.name?.charAt(0) || 'N'}</div>
            <div>
              <h2>{lead.customer?.name || 'Unknown Customer'}</h2>
              <span className={`status-badge ${getStatusColor(lead.status)}`}>{lead.status}</span>
            </div>
          </div>
          
          <div className="contact-info">
            <div className="contact-item">
              <FiPhone className="contact-icon" />
              <span>{lead.customer?.mobile || 'N/A'}</span>
            </div>
            <div className="contact-item">
              <FiMail className="contact-icon" />
              <span>{lead.customer?.email || 'No email provided'}</span>
            </div>
            <div className="contact-item">
              <FiMapPin className="contact-icon" />
              <span>{lead.customer?.city || ''} {lead.customer?.state || 'Location not provided'}</span>
            </div>
          </div>

          <div className="divider"></div>

          <div className="lead-meta">
            <div className="meta-row">
              <span className="meta-label">Lead Source</span>
              <span className="meta-value">{lead.source || 'N/A'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Interested System</span>
              <span className="meta-value">{lead.interestedSystem || 'N/A'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Assigned To</span>
              <span className="meta-value">{lead.assignedTo?.name || 'Unassigned'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Created On</span>
              <span className="meta-value">
                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Notes & History */}
        <div className="right-column">
          {/* Notes Card */}
          <div className="notes-card">
            <h3>Requirement Notes</h3>
            <p>{lead.requirementNotes || 'No notes added yet.'}</p>
          </div>

          {/* Status History Card */}
          <div className="history-card">
            <h3>Status History</h3>
            <div className="timeline">
              {lead.statusHistory && lead.statusHistory.length > 0 ? (
                lead.statusHistory.map((item, index) => (
                  <div className="timeline-item" key={index}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-status">{item.status}</p>
                      <p className="timeline-date">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-GB', { 
                          day: '2-digit', month: 'short', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        }) : 'N/A'}
                      </p>
                      <p className="timeline-note">{item.note}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-history">No history available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;