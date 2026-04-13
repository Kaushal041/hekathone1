import React, { useEffect, useState } from "react";
import "../styles/Pay.css";
import newRequest from "../utils/newRequest";
import { useNavigate, useParams } from "react-router-dom";

const parseApiError = (err, fallback) => {
  const payload = err?.response?.data;
  if (typeof payload === "string") return payload;
  if (payload?.message) return payload.message;
  if (payload?.error?.message) return payload.error.message;
  if (payload?.error?.description) return payload.error.description;
  if (payload?.error) return JSON.stringify(payload.error);
  if (payload) return JSON.stringify(payload);
  return err?.message || fallback;
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Pay = () => {
  const [errorMsg, setErrorMsg] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);

  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    let mounted = true;

    const prepareSdk = async () => {
      const loaded = await loadRazorpayScript();
      if (!mounted) return;

      if (!loaded) {
        setErrorMsg("Failed to load Razorpay SDK. Check your internet and try again.");
        setSdkReady(false);
        return;
      }

      setSdkReady(true);
      setIsPreparing(false);
    };

    prepareSdk();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRazorpayPayment = async () => {
    if (!sdkReady || !window.Razorpay) {
      setErrorMsg("Payment SDK is still loading. Please wait a moment and try again.");
      return;
    }

    setErrorMsg("");
    setIsPaying(true);

    let checkoutData;

    try {
      const res = await newRequest.post(`/orders/create-razorpay-order/${id}`);
      checkoutData = res?.data;

      if (!checkoutData?.orderId || !checkoutData?.key) {
        throw new Error("Unable to initialize payment. Please try again.");
      }
    } catch (err) {
      setErrorMsg(parseApiError(err, "Payment initialization failed. Please try again."));
      setIsPaying(false);
      return;
    }

    const options = {
      key: checkoutData.key,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      name: checkoutData.name,
      description: checkoutData.description,
      order_id: checkoutData.orderId,
      handler: async (response) => {
        try {
          await newRequest.post("/orders/verify-razorpay-payment", response);
          navigate("/orders");
        } catch (err) {
          setErrorMsg(parseApiError(err, "Payment verification failed. Please contact support."));
        } finally {
          setIsPaying(false);
        }
      },
      prefill: {
        name: currentUser?.username || "",
        email: currentUser?.email || "",
        contact: currentUser?.phone || "",
      },
      theme: {
        color: "#121212",
      },
      modal: {
        ondismiss: () => {
          setIsPaying(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      setErrorMsg(
        response?.error?.description ||
          "Payment failed. Please try another method."
      );
      setIsPaying(false);
    });
    rzp.open();
  };

  return (
    <div className="pay">
      <div className="payCard">
        <h2>Secure Payment</h2>
        <p>Complete your order safely with Razorpay.</p>

        {isPreparing && <div className="payInfo">Preparing payment service...</div>}

        {!!errorMsg && <div className="payError">{errorMsg}</div>}

        <button
          onClick={handleRazorpayPayment}
          disabled={isPreparing || isPaying || !sdkReady}
        >
          {isPaying ? "Opening Razorpay..." : "Pay with Razorpay"}
        </button>

        <div className="payHint">
          Do not refresh while payment is in progress.
        </div>
      </div>
    </div>
  );
};

export default Pay;