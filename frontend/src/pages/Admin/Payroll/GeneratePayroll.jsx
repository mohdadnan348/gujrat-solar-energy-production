import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiInfo, FiLock } from 'react-icons/fi';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import employeeService from '../../../services/employeeService';
import payrollService from '../../../services/payrollService';
import Loader from '../../../components/Common/Loader';
import './GeneratePayroll.css';

const GeneratePayroll = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    employeeId: '',
    month: (currentDate.getMonth() + 1).toString(),
    year: currentDate.getFullYear().toString(),
  });

  // Backend se aaya hua calculation data
  const [calculation, setCalculation] = useState(null);

  // Employees fetch karo
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeeService.getAll();
        setEmployees(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, employeeId: data[0]._id }));
        }
      } catch (err) {
        setError('Failed to load employees.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchEmployees();
  }, []);

  // Jab employee ya month change ho, calculation fetch karo
  useEffect(() => {
    const fetchCalculation = async () => {
      if (!formData.employeeId) return;
      setIsCalculating(true);
      setCalculation(null);
      try {
        // Yahan humne ek naya endpoint assume kiya hai, par backend me abhi generate endpoint hi hai.
        // Hum temporary ek "preview" API call kar rahe hain jo sirf calculation return kare.
        // Backend me humne `generatePayroll` me already calculation store kar diya hai, 
        // par agar hum sirf preview chahte hain toh hume ek naya route `/payroll/preview` chahiye.
        // Filhaal hum isko "generate" karke dikhayenge par finalize nahi karenge.
        
        // Note: Backend me preview endpoint nahi hai, isliye maine frontend me hi calculation
        // nahi kiya hai. Main backend me preview endpoint add karne ko bolunga.
        // Filhaal hum generate karenge aur draft state me save karenge.
        
        // Temporary: Hum calculation ke liye backend se attendance summary mangwa rahe hain.
        // Par filhaal backend me preview nahi hai, toh hum user ko bata denge ki 
        // generate dabane par hi calculation dikhega.
        
        setCalculation({
          // Ye dummy hai, asli data generate karte waqt aayega
          monthlySalary: 0,
          totalDays: 30,
          perDayRate: 0,
          presentDays: 0,
          halfDays: 0,
          unpaidLeaves: 0,
          payableDays: 0,
          deductions: 0,
          netPayable: 0
        });
      } catch (err) {
        setError('Failed to calculate payroll.');
      } finally {
        setIsCalculating(false);
      }
    };
    fetchCalculation();
  }, [formData.employeeId, formData.month, formData.year]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return;

    setIsCalculating(true);
    setError('');
    try {
      // Generate Payroll API Call (Ye draft state me save karega)
      const result = await payrollService.generate({
        employeeId: formData.employeeId,
        month: parseInt(formData.month),
        year: parseInt(formData.year)
      });
      setCalculation(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payroll.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFinalize = async () => {
    if (!calculation || !calculation._id) return;
    if (!window.confirm('Are you sure you want to finalize this payroll? Once finalized, it cannot be edited.')) return;

    try {
      await payrollService.finalize(calculation._id);
      alert('Payroll finalized successfully!');
      navigate('/admin/payroll');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to finalize payroll.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);
  };

  if (isFetching) return <Loader text="Loading employees..." />;

  return (
    <div className="generate-payroll-page">
      <div className="page-top-bar">
        <button className="back-btn" onClick={() => navigate('/admin/payroll')}>
          <FiArrowLeft /> Back to Payroll
        </button>
      </div>

      <div className="page-header">
        <h1>Generate Payroll</h1>
        <p>Calculate and finalize employee salary based on attendance</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="payroll-grid">
        {/* Left: Form */}
        <div className="form-card">
          <h3 className="section-title">1. Select Employee & Month</h3>
          <Select 
            label="Employee" 
            name="employeeId" 
            value={formData.employeeId} 
            onChange={handleInputChange}
            options={employees.map(emp => ({ label: `${emp.name} (${emp.mobile})`, value: emp._id }))}
            required
          />
          <div className="form-row">
            <Select 
              label="Month" 
              name="month" 
              value={formData.month} 
              onChange={handleInputChange}
              options={[
                { label: 'January', value: '1' }, { label: 'February', value: '2' }, { label: 'March', value: '3' },
                { label: 'April', value: '4' }, { label: 'May', value: '5' }, { label: 'June', value: '6' },
                { label: 'July', value: '7' }, { label: 'August', value: '8' }, { label: 'September', value: '9' },
                { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' },
              ]}
              required
            />
            <Select 
              label="Year" 
              name="year" 
              value={formData.year} 
              onChange={handleInputChange}
              options={[
                { label: '2026', value: '2026' },
                { label: '2025', value: '2025' },
              ]}
              required
            />
          </div>

          <div className="info-banner">
            <FiInfo className="info-icon" />
            <span>Calculation is based on the attendance records for the selected month.</span>
          </div>

          <Button 
            variant="secondary" 
            fullWidth 
            onClick={handleGenerate}
            isLoading={isCalculating}
            style={{ marginTop: '20px' }}
          >
            Calculate Payroll
          </Button>
        </div>

        {/* Right: Calculation Summary */}
        <div className="summary-card">
          <h3 className="section-title">2. Salary Breakdown</h3>
          
          {!calculation || calculation.monthlySalary === 0 ? (
            <div className="empty-state">
              <p>Select employee and click "Calculate Payroll" to see the breakdown.</p>
            </div>
          ) : (
            <>
              <div className="calc-row">
                <span>Monthly Salary</span>
                <span>{formatCurrency(calculation.monthlySalary)}</span>
              </div>
              <div className="calc-row">
                <span>Per Day Rate</span>
                <span>{formatCurrency(calculation.perDayRate)}</span>
              </div>
              
              <div className="divider"></div>
              
              <div className="calc-row">
                <span>Total Days in Month</span>
                <span>{calculation.totalDaysInMonth}</span>
              </div>
              <div className="calc-row">
                <span>Present Days</span>
                <span className="text-success">{calculation.presentDays}</span>
              </div>
              <div className="calc-row">
                <span>Half Days</span>
                <span>{calculation.halfDays}</span>
              </div>
              <div className="calc-row">
                <span>Unpaid Leaves</span>
                <span className="text-danger">{calculation.unpaidLeaves}</span>
              </div>
              
              <div className="divider"></div>
              
              <div className="calc-row">
                <span>Payable Days</span>
                <span className="font-bold">{calculation.payableDays}</span>
              </div>
              <div className="calc-row">
                <span>Deductions</span>
                <span className="text-danger">- {formatCurrency(calculation.deductions)}</span>
              </div>
              
              <div className="net-payable-box">
                <span>Net Payable</span>
                <span>{formatCurrency(calculation.netPayable)}</span>
              </div>

              <Button 
                variant="primary" 
                icon={<FiLock />} 
                fullWidth 
                onClick={handleFinalize}
                style={{ marginTop: '20px' }}
              >
                Finalize Payroll
              </Button>
              <p className="lock-note">Once finalized, this payroll record will be locked.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratePayroll;