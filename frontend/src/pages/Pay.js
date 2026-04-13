import React, { useEffect, useState } from "react";
import "../styles/Pay.css";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import newRequest from "../utils/newRequest";
import { useParams } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm";

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_KEY ||
    "pk_test_51J201hSHFIyVtnqxN74XMUe3JQIK1I9DD4DnLVPlWV3yiDoGSI6kVIZlW33T5QEFtPR0yL9hQVcp5WEU0dhSjzZa00NivWOi4j"
);

const Pay = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(true);

  const { id } = useParams();

  useEffect(() => {
    const makeRequest = async () => {
      try {
        setLoadingIntent(true);
        setErrorMsg("");
        const res = await newRequest.post(
          `/orders/create-payment-intent/${id}`
        );
        const secret = res?.data?.clientSecret;

        if (!secret || !secret.startsWith("pi_")) {
          setErrorMsg("Unable to initialize payment. Please refresh and try again.");
          setClientSecret("");
          return;
        }

        setClientSecret(secret);
      } catch (err) {
        setErrorMsg(
          err?.response?.data ||
            err?.message ||
            "Payment initialization failed. Please try again."
        );
      } finally {
        setLoadingIntent(false);
      }
    };
    makeRequest();
  }, [id]);

  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
  };

  return <div className="pay">
    {loadingIntent && <div>Preparing secure payment form...</div>}
    {!loadingIntent && errorMsg && <div>{errorMsg}</div>}
    {!loadingIntent && clientSecret && (
      <Elements key={clientSecret} options={options} stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    )}
  </div>;
};

export default Pay;