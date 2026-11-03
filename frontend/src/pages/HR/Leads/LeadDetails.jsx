import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiMail, FiMapPin, FiAlertCircle } from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import leadService from '../../../services/leadService';
import './LeadDetails.css';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await leadService.getById(id);
        if (active) { setLead(result?.data || result); setError(''); }
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Lead not found or you do not have access.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  if (loading) return <Loader fullScreen text="Loading Lead Details..." />;
  if (error || !lead) return (
    <div className="hr-lead-details-page"><div className="hr-lead-error-card">
      <FiAlertCircle size={44} /><h2>Unable to open lead</h2><p>{error || 'Lead not found.'}</p>
      <Button variant="primary" onClick={() => navigate('/hr/leads')}>Back to Leads</Button>
    </div></div>
  );

  return (
    <section className="hr-lead-details-page">
      <div className="hr-lead-details-top">
        <button type="button" onClick={() => navigate('/hr/leads')}><FiArrowLeft /> Back to Leads</button>
        <Button variant="primary" onClick={() => navigate('/hr/leads')}>Back to Management</Button>
      </div>
      <div className="hr-lead-details-grid">
        <div className="hr-lead-info-card">
          <div className="hr-lead-profile">
            <div className="hr-lead-large-avatar">{lead.customer?.name?.charAt(0) || '?'}</div>
            <div><h2>{lead.customer?.name || 'Unknown Customer'}</h2><span className="hr-lead-detail-status">{lead.status}</span></div>
          </div>
          <div className="hr-lead-contact">
            <div><FiPhone /><span>{lead.customer?.mobile || 'N/A'}</span></div>
            <div><FiMail /><span>{lead.customer?.email || 'No email provided'}</span></div>
            <div><FiMapPin /><span>{lead.location || [lead.customer?.city, lead.customer?.state].filter(Boolean).join(', ') || 'Location not provided'}</span></div>
          </div>
          <hr />
          <div className="hr-lead-meta">
            <div><span>Lead Source</span><strong>{lead.source || '—'}</strong></div>
            <div><span>Interested System</span><strong>{lead.interestedSystem || '—'}</strong></div>
            <div><span>Assigned To</span><strong>{lead.assignedTo?.name || 'Unassigned'}</strong></div>
            <div><span>Follow-up Date</span><strong>{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-IN') : '—'}</strong></div>
            <div><span>Created On</span><strong>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '—'}</strong></div>
          </div>
        </div>
        <div className="hr-lead-right">
          <div className="hr-lead-notes-card"><h3>Requirement Notes</h3><p>{lead.requirementNotes || 'No notes added yet.'}</p></div>
          <div className="hr-lead-history-card"><h3>Status History</h3>
            {lead.statusHistory?.length ? <div className="hr-lead-timeline">{lead.statusHistory.map((item, index) => (
              <div className="hr-lead-timeline-item" key={`${item._id || item.updatedAt || item.status}-${index}`}>
                <span className="hr-lead-timeline-dot" /><div><strong>{item.status}</strong>
                  <small>{item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-IN') : 'Date unavailable'}</small>
                  <p>{item.note || ''}</p></div>
              </div>
            ))}</div> : <p className="hr-lead-no-history">No history available.</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadDetails;
