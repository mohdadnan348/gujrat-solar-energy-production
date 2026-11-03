import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiCheck, FiX, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Select from '../../../components/Common/Select';
import Modal from '../../../components/Common/Modal';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import leaveService from '../../../services/hrLeaveService';
import './LeaveList.css';

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB');
};

const LeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await leaveService.getTeamLeaves();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load team leave requests.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const openReview = (leave) => {
    setSelectedLeave(leave);
    setReviewNote(leave.adminNote || '');
    setIsModalOpen(true);
  };

  const closeReview = () => {
    if (isUpdating) return;
    setIsModalOpen(false);
    setSelectedLeave(null);
    setReviewNote('');
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedLeave?._id) return;
    setIsUpdating(true);
    setError('');
    setNotice('');
    try {
      await leaveService.updateLeaveStatus(selectedLeave._id, {
        status: newStatus,
        adminNote: reviewNote.trim(),
      });
      setNotice(`Leave ${newStatus.toLowerCase()} successfully.`);
      setIsModalOpen(false);
      setSelectedLeave(null);
      setReviewNote('');
      await fetchLeaves();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update leave status.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Pending') return 'status-pending';
    if (status === 'Approved') return 'status-approved';
    if (status === 'Rejected') return 'status-rejected';
    return '';
  };

  const filteredLeaves = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return leaves.filter((leave) => {
      const employeeName = leave.employee?.name || '';
      const employeeEmail = leave.employee?.email || '';
      const matchesSearch = !query ||
        employeeName.toLowerCase().includes(query) ||
        employeeEmail.toLowerCase().includes(query) ||
        String(leave.reason || '').toLowerCase().includes(query);
      return matchesSearch && (!statusFilter || leave.status === statusFilter);
    });
  }, [leaves, searchTerm, statusFilter]);

  const pendingCount = leaves.filter((leave) => leave.status === 'Pending').length;
  const approvedCount = leaves.filter((leave) => leave.status === 'Approved').length;
  const rejectedCount = leaves.filter((leave) => leave.status === 'Rejected').length;

  const columns = [
    { header: 'Employee', accessor: 'employee', render: (row) => (
      <div className="employee-cell">
        <div className="avatar-sm">{row.employee?.name?.charAt(0) || 'N'}</div>
        <div><div className="font-bold">{row.employee?.name || 'Unknown'}</div>
          <div className="text-muted">{row.employee?.email || ''}</div></div>
      </div>
    )},
    { header: 'Leave Type', accessor: 'leaveType' },
    { header: 'Duration', accessor: 'startDate', render: (row) => (
      <div className="date-range-cell">
        <FiCalendar className="icon-sm" />
        <span>{formatDate(row.startDate)} – {formatDate(row.endDate)}</span>
        <span className="days-badge">{row.days} Days</span>
      </div>
    )},
    { header: 'Reason', accessor: 'reason', render: (row) => (
      <div className="reason-cell" title={row.reason}>{row.reason || '—'}</div>
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`status-badge ${getStatusBadge(row.status)}`}>{row.status}</span>
    )},
    { header: 'Action', width: '110px', render: (row) => (
      row.status === 'Pending' ? (
        <div className="action-buttons">
          <button type="button" className="icon-btn approve" title="Review and approve"
            onClick={() => openReview(row)}><FiCheck /></button>
          <button type="button" className="icon-btn reject" title="Review and reject"
            onClick={() => openReview(row)}><FiX /></button>
        </div>
      ) : <span className="text-muted">Reviewed</span>
    )},
  ];

  if (isLoading && leaves.length === 0) return <Loader text="Loading team leave requests..." />;

  return (
    <div className="leave-page">
      <div className="page-header">
        <div><h1>Team Leave Management</h1><p>Review leave requests submitted by your team employees</p></div>
        <Button variant="secondary" icon={<FiRefreshCw />} onClick={fetchLeaves}>Refresh</Button>
      </div>

      <div className="leave-summary">
        <div className="leave-summary-card"><span>Total Requests</span><strong>{leaves.length}</strong></div>
        <div className="leave-summary-card pending"><span>Pending</span><strong>{pendingCount}</strong></div>
        <div className="leave-summary-card approved"><span>Approved</span><strong>{approvedCount}</strong></div>
        <div className="leave-summary-card rejected"><span>Rejected</span><strong>{rejectedCount}</strong></div>
      </div>

      {error && <div className="leave-alert error" role="alert">{error}
        <button type="button" onClick={fetchLeaves}>Retry</button></div>}
      {notice && <div className="leave-alert success" role="status">{notice}</div>}

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input type="search" placeholder="Search employee, email or reason..."
            value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
        <div className="filter-actions">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { label: 'All Requests', value: '' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
            ]} />
        </div>
      </div>

      {isLoading && <div className="leave-refreshing">Refreshing team leave requests...</div>}
      <Table columns={columns} data={filteredLeaves} emptyMessage="No team leave requests found." />

      <Modal isOpen={isModalOpen} onClose={closeReview} title="Review Leave Request" size="sm">
        {selectedLeave && (
          <div className="leave-modal-content">
            <div className="leave-details">
              <p><strong>Employee:</strong> {selectedLeave.employee?.name || 'Unknown'}</p>
              <p><strong>Email:</strong> {selectedLeave.employee?.email || '—'}</p>
              <p><strong>Type:</strong> {selectedLeave.leaveType}</p>
              <p><strong>Dates:</strong> {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}</p>
              <p><strong>Duration:</strong> {selectedLeave.days} day(s)</p>
              <p><strong>Reason:</strong> {selectedLeave.reason}</p>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="leave-review-note">Review Note (Optional)</label>
              <textarea id="leave-review-note" className="form-textarea" rows={3}
                value={reviewNote} onChange={(event) => setReviewNote(event.target.value)}
                maxLength={1000} />
            </div>
            <div className="leave-modal-actions">
              <Button variant="danger" disabled={isUpdating}
                onClick={() => handleUpdateStatus('Rejected')}>{isUpdating ? 'Saving...' : 'Reject Request'}</Button>
              <Button variant="primary" disabled={isUpdating}
                onClick={() => handleUpdateStatus('Approved')}>{isUpdating ? 'Saving...' : 'Approve Request'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveList;
