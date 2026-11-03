import { useEffect, useState } from 'react';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import './EmployeeForm.css';

const getInitialForm = (employee = {}) => ({
  name: employee.name || '',
  email: employee.email || '',
  mobile: employee.mobile || '',
  password: '',
  monthlySalary: employee.monthlySalary ?? '',
  isActive: employee.isActive !== undefined ? Boolean(employee.isActive) : true,
});

const EmployeeForm = ({ initialData = {}, onSubmit, onCancel, isSubmitting = false }) => {
  const isEditing = Boolean(initialData?._id);
  const [formData, setFormData] = useState(() => getInitialForm(initialData));
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setFormData(getInitialForm(initialData));
    setFormError('');
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleStatusChange = (event) => {
    setFormData((current) => ({ ...current, isActive: event.target.value === 'true' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      mobile: formData.mobile.trim(),
      monthlySalary: Number(formData.monthlySalary),
      isActive: formData.isActive,
    };

    if (!isEditing || formData.password.trim()) {
      payload.password = formData.password;
    }

    if (!payload.name || !payload.email || !payload.mobile) {
      setFormError('Please complete all required fields.');
      return;
    }
    if (!Number.isFinite(payload.monthlySalary) || payload.monthlySalary < 0) {
      setFormError('Enter a valid monthly salary.');
      return;
    }
    if (!isEditing && (!payload.password || payload.password.length < 6)) {
      setFormError('Password must contain at least 6 characters.');
      return;
    }
    if (isEditing && payload.password && payload.password.length < 6) {
      setFormError('New password must contain at least 6 characters.');
      return;
    }

    try {
      await onSubmit(payload);
    } catch (error) {
      setFormError(error?.response?.data?.message || error?.message || 'Unable to save employee.');
    }
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <h4 className="form-section-title">Personal Details</h4>
      <div className="form-row">
        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange}
          placeholder="e.g. Siddiqui Wasim" required />
        <Input label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange}
          placeholder="10-digit mobile" required />
      </div>

      <div className="form-row">
        <Input label="Email Address" name="email" type="email" value={formData.email}
          onChange={handleChange} placeholder="employee@company.com" required />
        <Input label={isEditing ? 'New Password (Optional)' : 'Create Password'}
          name="password" type="password" value={formData.password} onChange={handleChange}
          placeholder={isEditing ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
          required={!isEditing} />
      </div>

      <h4 className="form-section-title">Employment Details</h4>
      <div className="form-row">
        <Input label="Monthly Salary (₹)" name="monthlySalary" type="number"
          value={formData.monthlySalary} onChange={handleChange} placeholder="e.g. 25000"
          min="0" step="0.01" required />
        <Select label="Account Status" name="isActive" value={String(formData.isActive)}
          onChange={handleStatusChange}
          options={[
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ]} />
      </div>

      {formError && <p className="employee-form-error" role="alert">{formError}</p>}

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} type="button" disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
