import { useState } from 'react';
import { FiLogIn, FiLogOut } from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import attendanceService from '../../../services/attendanceService';
import './CheckInOut.css';

const CheckInOut = ({ attendance, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      await attendanceService.checkIn();
      onUpdate(); // Refresh parent data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      await attendanceService.checkOut();
      onUpdate(); // Refresh parent data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="check-inout-actions">
      {!attendance ? (
        <Button 
          variant="primary" 
          icon={<FiLogIn />} 
          onClick={handleCheckIn}
          isLoading={isLoading}
        >
          Check In Now
        </Button>
      ) : !attendance.checkOut ? (
        <Button 
          variant="danger" 
          icon={<FiLogOut />} 
          onClick={handleCheckOut}
          isLoading={isLoading}
        >
          Check Out
        </Button>
      ) : (
        <div className="completed-badge">
          <span>Day Completed ✓</span>
        </div>
      )}
    </div>
  );
};

export default CheckInOut;