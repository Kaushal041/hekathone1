import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Success.css";

const Success = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/orders");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="success-container">
      <div className="success-icon">✅</div>
      <div className="success-message">Order completed successfully!</div>
      <div className="success-redirect">
        You are being redirected to the orders page.<br />
        Please do not close the page.
      </div>
    </div>
  );
};

export default Success;