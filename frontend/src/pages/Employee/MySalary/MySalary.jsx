import { useState, useEffect } from 'react';
import { FiDollarSign, FiCalendar, FiDownload, FiLock } from 'react-icons/fi';
import Loader from '../../../components/Common/Loader';
import payrollService from '../../../services/payrollService';
import './MySalary.css';

const MySalary = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const data = await payrollService.getMySalary();
        setPayrolls(data);
      } catch (err) {
        setError('Failed to load salary details.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalary();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);
  };

  if (isLoading) return <Loader text="Loading salary details..." />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-salary-page">
      <div className="page-header">
        <div>
          <h1>My Salary</h1>
          <p>View your finalized salary slips and breakdown</p>
        </div>
      </div>

      {payrolls.length === 0 ? (
        <div className="empty-state">
          <FiLock size={40} />
          <h3>No Salary Generated Yet</h3>
          <p>Your salary slip will appear here once the Admin finalizes the payroll.</p>
        </div>
      ) : (
        <div className="salary-grid">
          {payrolls.map((payroll) => (
            <div className="salary-card" key={payroll._id}>
              <div className="salary-card-header">
                <div className="salary-month">
                  <FiCalendar />
                  <span>{new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
                <span className={`status-badge ${payroll.status === 'Paid' ? 'status-paid' : 'status-finalized'}`}>
                  {payroll.status}
                </span>
              </div>

              <div className="salary-body">
                <div className="salary-row">
                  <span>Base Salary</span>
                  <span>{formatCurrency(payroll.monthlySalary)}</span>
                </div>
                <div className="salary-row">
                  <span>Present Days</span>
                  <span className="text-success">{payroll.presentDays}</span>
                </div>
                <div className="salary-row">
                  <span>Unpaid Leaves</span>
                  <span className="text-danger">{payroll.unpaidLeaves}</span>
                </div>
                <div className="salary-row">
                  <span>Deductions</span>
                  <span className="text-danger">- {formatCurrency(payroll.deductions)}</span>
                </div>
                
                <div className="salary-divider"></div>
                
                <div className="salary-row net-payable">
                  <span>Net Payable</span>
                  <span>{formatCurrency(payroll.netPayable)}</span>
                </div>
              </div>

              <div className="salary-card-footer">
                <button className="download-btn">
                  <FiDownload /> Download Slip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySalary;