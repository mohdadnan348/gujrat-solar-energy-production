import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  disabled = false,
  icon = null,
  fullWidth = false,
  form = null // <-- NAYA PROP ADD KIYA
}) => {
  const classes = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''}`;

  return (
    <button 
      type={type} 
      className={classes} 
      onClick={onClick} 
      disabled={disabled || isLoading}
      form={form} // <-- FORM ATTRIBUTE PASS KIYA
    >
      {isLoading ? (
        <span className="btn-spinner"></span>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;