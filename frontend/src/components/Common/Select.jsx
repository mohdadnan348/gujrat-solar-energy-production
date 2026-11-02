import './Select.css';

const Select = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [], 
  error, 
  required = false,
  disabled = false 
}) => {
  return (
    <div className="select-container">
      {label && (
        <label className="select-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className={`select-wrapper ${error ? 'has-error' : ''}`}>
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="select-field"
        >
          <option value="" disabled>Select an option</option>
          {options.map((opt, index) => (
            <option key={index} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom Arrow Icon */}
        <span className="select-arrow">▼</span>
      </div>
      
      {error && <span className="select-error-text">{error}</span>}
    </div>
  );
};

export default Select;