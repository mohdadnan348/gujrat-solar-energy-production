import './Input.css';

const Input = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  icon,
  required = false,
  disabled = false 
}) => {
  return (
    <div className="input-container">
      {label && (
        <label className="input-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className={`input-wrapper ${error ? 'has-error' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="input-field"
        />
      </div>
      
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default Input;