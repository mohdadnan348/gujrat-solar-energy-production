import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Loader from '../../../components/Common/Loader';
import CheckInOut from './CheckInOut';
import attendanceService from '../../../services/attendanceService';
import './MyAttendance.css';

const MyAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Helper: Date ko local timezone ke hisaab se YYYY-MM-DD format me badalne ke liye
  const getLocalDateString = (dateObj) => {
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr.substring(0, 7)); // Only YYYY-MM

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getMyAttendance();
      setAttendance(data);
      setError('');
    } catch (err) {
      setError('Failed to load attendance data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Aaj ki attendance find karo (sahi compare ke saath)
  const todayAttendance = attendance.find(a => getLocalDateString(a.date) === todayStr);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'status-present';
      case 'Absent': return 'status-absent';
      case 'Half-Day': return 'status-halfday';
      case 'Late': return 'status-late';
      case 'Weekly Off': return 'status-off';
      case 'Holiday': return 'status-holiday';
      case 'Paid Leave': return 'status-paid-leave';
      case 'Unpaid Leave': return 'status-unpaid-leave';
      default: return '';
    }
  };

  const columns = [
    { header: 'Date', accessor: 'date', render: (row) => (
      new Date(row.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    )},
    { header: 'Check In', accessor: 'checkIn', render: (row) => (
      row.checkIn ? new Date(row.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'
    )},
    { header: 'Check Out', accessor: 'checkOut', render: (row) => (
      row.checkOut ? new Date(row.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'
    )},
    { header: 'Work Hours', accessor: 'workHours', render: (row) => (
      row.workHours > 0 ? `${row.workHours} hrs` : '-'
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`status-badge ${getStatusColor(row.status)}`}>{row.status}</span>
    )},
  ];

  if (isLoading) return <Loader text="Loading attendance..." />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-attendance-page">
      <div className="page-header">
        <div>
          <h1>My Attendance</h1>
          <p>Mark your daily attendance and view your history</p>
        </div>
        <div className="date-filter">
          <FiCalendar className="date-icon" />
          <input 
            type="month" 
            className="date-input" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Check In / Out Card */}
      <div className="check-inout-card">
        <div className="check-status">
          <div className="status-icon-wrapper">
            {todayAttendance ? <FiCheckCircle color="#38a169" size={40} /> : <FiInfo color="#a0aec0" size={40} />}
          </div>
          <div>
            <h2>{todayAttendance ? 'Attendance Marked' : 'Not Marked Yet'}</h2>
            <p>
              {todayAttendance 
                ? (todayAttendance.checkOut 
                    ? `Day completed. Worked ${todayAttendance.workHours} hours.`
                    : `Checked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Please check out when you leave.`
                  )
                : 'Please mark your attendance for today.'}
            </p>
          </div>
        </div>
        
        <CheckInOut 
          attendance={todayAttendance} 
          onUpdate={fetchAttendance}
        />
      </div>

      {/* Attendance History Table */}
      <div className="history-section">
        <h3>Attendance History</h3>
        <Table columns={columns} data={attendance} emptyMessage="No attendance records found." />
      </div>
    </div>
  );
};

export default MyAttendance;