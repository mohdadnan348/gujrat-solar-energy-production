import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBell, FiPlus, FiCheckCircle, FiInfo, FiAlertCircle,
  FiClock, FiRefreshCw, FiTrash2,
} from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import Modal from '../../../components/Common/Modal';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Loader from '../../../components/Common/Loader';
import { useAuth } from '../../../context/AuthContext';
import notificationService from '../../../services/notificationService';
import './Notifications.css';

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const Notifications = () => {
  const { user } = useAuth();

  // Accept role values such as "Admin", "ADMIN" or "admin".
  const userRole = String(user?.role || 'Employee').trim().toLowerCase();
  const isAdmin = userRole === 'admin';
  const userId = user?._id || user?.id;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'Announcement',
    recipientIds: [],
  });

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isAdmin) {
        const data = await notificationService.getSentHistory();
        if (!Array.isArray(data)) {
          throw new Error('Sent notifications API did not return a list.');
        }
        setNotifications(data);
        setUnreadCount(0);
      } else {
        const data = await notificationService.getMyNotifications();
        const inbox = Array.isArray(data?.notifications) ? data.notifications : [];
        setNotifications(inbox);
        setUnreadCount(Number(data?.unreadCount) || 0);
      }
    } catch (err) {
      setError(getError(err, 'Failed to load notifications.'));
      // Keep the previous list if refresh fails; do not erase visible records.
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSendNotification = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Please enter both notification title and message.');
      return;
    }

    setIsSending(true);
    try {
      await notificationService.send({
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        recipientIds: formData.recipientIds,
      });

      setIsModalOpen(false);
      setFormData({
        title: '',
        message: '',
        type: 'Announcement',
        recipientIds: [],
      });
      setNotice('Notification sent successfully.');
      await fetchNotifications();
    } catch (err) {
      setError(getError(err, 'Failed to send notification.'));
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = async (notification) => {
    if (!notification?._id) return;

    const alreadyRead = notification.readBy?.some(
      (id) => String(id?._id || id) === String(userId)
    );
    if (alreadyRead) return;

    setNotifications((current) =>
      current.map((item) =>
        item._id === notification._id
          ? { ...item, readBy: [...(item.readBy || []), userId] }
          : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await notificationService.markAsRead(notification._id);
    } catch (err) {
      setError(getError(err, 'Could not mark notification as read.'));
      await fetchNotifications();
    }
  };

  const handleDelete = async (notification) => {
    if (!window.confirm(`Delete "${notification.title}"?`)) return;

    setError('');
    setNotice('');
    try {
      await notificationService.delete(notification._id);
      setNotifications((current) =>
        current.filter((item) => item._id !== notification._id)
      );
      setNotice('Notification deleted.');
    } catch (err) {
      setError(getError(err, 'Failed to delete notification.'));
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Lead Assignment': return <FiCheckCircle className="icon-blue" />;
      case 'Leave Decision': return <FiInfo className="icon-green" />;
      case 'Task Assignment': return <FiAlertCircle className="icon-orange" />;
      default: return <FiBell className="icon-purple" />;
    }
  };

  const visibleNotifications = useMemo(
    () => notifications,
    [notifications]
  );

  if (isLoading && notifications.length === 0) {
    return <Loader text="Loading notifications..." />;
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>
            {isAdmin
              ? 'Send and manage notifications'
              : `Your notifications and updates${unreadCount ? ` · ${unreadCount} unread` : ''}`}
          </p>
        </div>

        <div className="notification-header-actions">
          <Button
            variant="secondary"
            icon={<FiRefreshCw />}
            onClick={fetchNotifications}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              icon={<FiPlus />}
              onClick={() => setIsModalOpen(true)}
            >
              Send Notification
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button type="button" onClick={fetchNotifications}>Retry</button>
        </div>
      )}

      {notice && (
        <div className="notification-success" role="status">{notice}</div>
      )}

      <div className="notifications-list">
        {visibleNotifications.length === 0 ? (
          <div className="empty-state">
            <FiBell size={40} />
            <p>No notifications available</p>
          </div>
        ) : (
          visibleNotifications.map((notif) => {
            const isRead = isAdmin || notif.readBy?.some(
              (id) => String(id?._id || id) === String(userId)
            );

            return (
              <div
                key={notif._id}
                className={`notification-card ${!isRead ? 'unread' : ''}`}
                onClick={() => !isAdmin && !isRead && handleMarkAsRead(notif)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !isAdmin && !isRead) {
                    handleMarkAsRead(notif);
                  }
                }}
                role={isAdmin ? undefined : 'button'}
                tabIndex={isAdmin ? undefined : 0}
              >
                <div className="notification-icon-wrapper">
                  {getIcon(notif.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notif.title}</h4>
                    <span className="notification-time">
                      <FiClock /> {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  <p>{notif.message}</p>
                  <span className="notification-type">{notif.type}</span>

                  {isAdmin && (
                    <div className="recipient-info">
                      Sent to: {notif.recipients?.length
                        ? notif.recipients
                            .map((recipient) => recipient?.name || 'Employee')
                            .join(', ')
                        : 'No recipients'}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    className="notification-delete"
                    title="Delete notification"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(notif);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                )}

                {!isRead && <div className="unread-dot" />}
              </div>
            );
          })
        )}
      </div>

      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSending && setIsModalOpen(false)}
          title="Send New Notification"
          size="md"
        >
          <form onSubmit={handleSendNotification}>
            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter notification title"
              required
            />

            <div className="form-group">
              <label className="form-label" htmlFor="notification-message">
                Message
              </label>
              <textarea
                id="notification-message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Write your message here..."
                className="form-textarea"
                rows={4}
                maxLength={5000}
                required
              />
            </div>

            <div className="form-grid">
              <Select
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                options={[
                  { label: 'Announcement', value: 'Announcement' },
                  { label: 'Task Assignment', value: 'Task Assignment' },
                  { label: 'Lead Assignment', value: 'Lead Assignment' },
                  { label: 'Leave Decision', value: 'Leave Decision' },
                  { label: 'Payroll', value: 'Payroll' },
                ]}
              />

              <Select
                label="Send To"
                value="all"
                onChange={() => {}}
                options={[
                  { label: 'All Active Employees', value: 'all' },
                ]}
              />
            </div>

            <p className="recipient-info">
              This sends the notification to all active employees.
            </p>

            <div className="form-actions">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                type="button"
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSending}
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Notifications;
