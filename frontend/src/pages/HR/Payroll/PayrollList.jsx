import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiEye, FiLock } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Select from '../../../components/Common/Select';
import Modal from '../../../components/Common/Modal';
import Loader from '../../../components/Common/Loader';
import payrollService from '../../../services/payrollService';
import './PayrollList.css';

const PayrollList = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const data = await payrollService.getAll();
      setPayrolls(data);
      setError('');
    } catch (err) {
      setError('Failed to load payroll data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Finalized': return 'status-finalized';
      case 'Paid': return 'status-paid';
      default: return '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);
  };

  const columns = [
    { header: 'Employee', accessor: 'employee', render: (row) => (
      <div className="employee-cell">
        <div className="avatar-sm">{row.employee?.name?.charAt(0) || 'E'}</div>
        <span className="font-bold">{row.employee?.name || 'Unknown'}</span>
      </div>
    )},
    { header: 'Month', accessor: 'month', render: (row) => `${row.month}/${row.year}` },
    { header: 'Base Salary', accessor: 'monthlySalary', render: (row) => formatCurrency(row.monthlySalary) },
    { header: 'Payable Days', accessor: 'payableDays' },
    { header: 'Deductions', accessor: 'deductions', render: (row) => (
      <span className="text-danger">{formatCurrency(row.deductions)}</span>
    )},
    { header: 'Net Payable', accessor: 'netPayable', render: (row) => (
      <span className="text-success font-bold">{formatCurrency(row.netPayable)}</span>
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`status-badge ${getStatusColor(row.status)}`}>{row.status}</span>
    )},
    { header: 'Actions', width: '80px', render: (row) => (
      <button className="icon-btn view" onClick={() => {
        setSelectedPayroll(row);
        setIsModalOpen(true);
      }}>
        <FiEye />
      </button>
    )}
  ];

  if (isLoading) return <Loader text="Loading payroll..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredPayrolls = payrolls.filter(p => 
    p.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="payroll-page">
      <div className="page-header">
        <div>
          <h1>Salary / Payroll</h1>
          <p>Manage attendance-based employee salaries</p>
        </div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => navigate('/admin/payroll/generate')}>
          Generate Payroll
        </Button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by employee..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <Select options={[
            { label: 'All Statuses', value: '' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Finalized', value: 'Finalized' },
            { label: 'Paid', value: 'Paid' },
          ]} />
        </div>
      </div>

      <Table columns={columns} data={filteredPayrolls} emptyMessage="No payroll records found." />

      {/* Payslip Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedPayroll(null); }} 
        title="Salary Slip" 
        size="sm"
      >
        {selectedPayroll && (
          <div className="payslip-modal">
            <div className="payslip-header">
              <h2>{selectedPayroll.employee?.name || 'Unknown'}</h2>
              <p>{selectedPayroll.month}/{selectedPayroll.year}</p>
            </div>
            
            <div className="payslip-body">
              <div className="payslip-row">
                <span>Base Salary</span>
                <span>{formatCurrency(selectedPayroll.monthlySalary)}</span>
              </div>
              <div className="payslip-row">
                <span>Payable Days</span>
                <span>{selectedPayroll.payableDays} / {selectedPayroll.totalDaysInMonth}</span>
              </div>
              <div className="payslip-row text-danger">
                <span>Deductions</span>
                <span>- {formatCurrency(selectedPayroll.deductions)}</span>
              </div>
              <div className="payslip-divider"></div>
              <div className="payslip-total">
                <span>Net Payable</span>
                <span>{formatCurrency(selectedPayroll.netPayable)}</span>
              </div>
            </div>
            
            <div className="payslip-footer">
              <span className={`status-badge ${getStatusColor(selectedPayroll.status)}`}>
                {selectedPayroll.status}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PayrollList;