import { useEffect, useState } from 'react';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import './EmployeeForm.css';

const initialForm = (data = {}) => ({
  name: data.name || '', email: data.email || '', mobile: data.mobile || '',
  password: '', monthlySalary: data.monthlySalary ?? '',
  isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
  role: data.role === 'HR' ? 'HR' : 'Employee',
});

export default function EmployeeForm({
  initialData = {}, onSubmit, onCancel, isSubmitting = false, canCreateHR = false,
}) {
  const isEditing = Boolean(initialData?._id);
  const [formData, setFormData] = useState(() => initialForm(initialData));
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setFormData(initialForm(initialData));
    setFormError('');
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((old) => ({ ...old, [name]: value }));
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
      role: canCreateHR ? formData.role : 'Employee',
    };
    if (!isEditing || formData.password.trim()) payload.password = formData.password;

    if (!payload.name || !payload.email || !payload.mobile) return setFormError('Please complete all required fields.');
    if (!Number.isFinite(payload.monthlySalary) || payload.monthlySalary < 0) return setFormError('Enter a valid monthly salary.');
    if (!isEditing && (!payload.password || payload.password.length < 6)) return setFormError('Password must contain at least 6 characters.');
    if (isEditing && payload.password && payload.password.length < 6) return setFormError('New password must contain at least 6 characters.');

    try {
      await onSubmit(payload);
    } catch (error) {
      setFormError(error?.response?.data?.message || error?.message || 'Unable to save account.');
    }
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <h4 className="form-section-title">Personal Details</h4>
      <div className="form-row">
        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="Full name" required />
        <Input label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile" required />
      </div>
      <div className="form-row">
        <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="name@company.com" required />
        <Input label={isEditing ? 'New Password (Optional)' : 'Create Password'} name="password" type="password"
          value={formData.password} onChange={handleChange}
          placeholder={isEditing ? 'Leave blank to keep current password' : 'Minimum 6 characters'} required={!isEditing} />
      </div>

      {canCreateHR && !isEditing && <>
        <h4 className="form-section-title">Account Role</h4>
        <div className="form-row">
          <Select label="Create Account As" name="role" value={formData.role} onChange={handleChange}
            options={[{ label: 'Employee', value: 'Employee' }, { label: 'HR', value: 'HR' }]} />
        </div>
        <p className="employee-form-hint">Only Admin can create HR accounts. HR users can create Employees only.</p>
      </>}

      <h4 className="form-section-title">Employment Details</h4>
      <div className="form-row">
        <Input label="Monthly Salary (₹)" name="monthlySalary" type="number" value={formData.monthlySalary}
          onChange={handleChange} placeholder="e.g. 25000" min="0" step="0.01" required />
        <Select label="Account Status" name="isActive" value={String(formData.isActive)}
          onChange={(e) => setFormData((old) => ({ ...old, isActive: e.target.value === 'true' }))}
          options={[{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }]} />
      </div>
      {formError && <p className="employee-form-error" role="alert">{formError}</p>}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} type="button" disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Account' : `Create ${canCreateHR && formData.role === 'HR' ? 'HR' : 'Employee'}`}
        </Button>
      </div>
    </form>
  );
}
