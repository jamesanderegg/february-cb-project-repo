// src/components/Button.jsx
const Button = ({ onClick, label }) => (
    <button onClick={onClick} className="btn">
      {label}
    </button>
  );
  
  export default Button;
  