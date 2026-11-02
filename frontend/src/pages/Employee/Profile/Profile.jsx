import { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiLock, FiEdit2 } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Common/Button';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>View your personal and employment details</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left: Profile Card */}
        <div className="profile-card">
          <div className="avatar-container">
            <div className="avatar-xl">
              {user?.name?.charAt(0) || 'E'}
            </div>
          </div>
          <h2 className="profile-name">{user?.name || 'Employee Name'}</h2>
          <p className="profile-role">{user?.role || 'Employee'}</p>
          
          <div className="profile-status">
            <span className="status-dot"></span>
            <span>Active Employee</span>
          </div>
        </div>

        {/* Right: Details Card */}
        <div className="details-card">
          <h3 className="section-title">Personal Information</h3>
          
          <div className="info-row">
            <div className="info-label"><FiUser /> Full Name</div>
            <div className="info-value">{user?.name || 'N/A'}</div>
          </div>
          
          <div className="info-row">
            <div className="info-label"><FiMail /> Email Address</div>
            <div className="info-value">{user?.email || 'N/A'}</div>
          </div>
          
          <div className="info-row">
            <div className="info-label"><FiPhone /> Mobile Number</div>
            <div className="info-value">{user?.mobile || 'N/A'}</div>
          </div>

          <h3 className="section-title" style={{ marginTop: '30px' }}>Employment Details</h3>
          
          <div className="info-row">
            <div className="info-label"><FiBriefcase /> Designation</div>
            <div className="info-value">Solar Sales Executive</div>
          </div>

          <div className="info-row">
            <div className="info-label"><FiLock /> Account Status</div>
            <div className="info-value">
              <span className="badge-active">Active</span>
            </div>
          </div>

          <div className="profile-actions">
            <Button variant="secondary" icon={<FiLock />} disabled>
              Change Password (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;