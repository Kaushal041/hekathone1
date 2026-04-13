import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Orders.css";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../utils/newRequest";
import messageIcon from "../assets/chat-icon.png";

const Orders = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const navigate = useNavigate();
  const { isLoading, error, data } = useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      newRequest.get(`/orders`).then((res) => {
        return res.data;
      }),
  });

  const handleContact = async (order) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const sellerId = order.sellerId;
    const buyerId = order.buyerId;
    const id = sellerId + buyerId;

    try {
      const res = await newRequest.get(`/conversations/single/${id}`);
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      if (err.response?.status === 404) {
        const res = await newRequest.post(`/conversations/`, {
          to: currentUser.isSeller ? buyerId : sellerId,
        });
        navigate(`/message/${res.data.id}`);
      }
    }
  };

  return (
    <div className="orders">
      {isLoading ? (
        <div className="loadingPlaceholder">
          <div className="spinner"></div>
          <div>Loading Job Confirmations...</div>
        </div>
      ) : error ? (
        <div className="loadingPlaceholder">
          <div className="errorMessage">
            Sorry, something went wrong while loading your transactions.
          </div>
        </div>
      ) : (
        <div className="ordersContainer">
          <div className="ordersTitle">
            <h1>{currentUser.isSeller ? "Worker Dashboard" : "Customer Dashboard"}</h1>
          </div>

          <div className="dashboardStats">
            {currentUser.isSeller ? (
              <>
                <div className="statCard">
                  <h3>Available Jobs</h3>
                  <p>{Math.max((data?.length || 0) + 6, 6)}</p>
                </div>
                <div className="statCard">
                  <h3>My Bids</h3>
                  <p>{Math.max(data?.length || 0, 0)}</p>
                </div>
                <div className="statCard">
                  <h3>My Tasks</h3>
                  <p>{data?.length || 0}</p>
                </div>
              </>
            ) : (
              <>
                <div className="statCard">
                  <h3>Posted Jobs</h3>
                  <p>{Math.max(data?.length || 0, 0)}</p>
                </div>
                <div className="statCard">
                  <h3>Received Bids</h3>
                  <p>{Math.max((data?.length || 0) * 2, 0)}</p>
                </div>
                <div className="statCard">
                  <h3>Accepted Tasks</h3>
                  <p>{data?.length || 0}</p>
                </div>
              </>
            )}
          </div>

          <h2 className="tableHeading">{currentUser.isSeller ? "My Tasks" : "My Bookings"}</h2>
          <table>
            <tr>
              <th>Image</th>
              <th>Job</th>
              <th>Amount</th>
              <th>Contact</th>
            </tr>
            {data.map((order) => (
              <tr key={order._id}>
                <td>
                  <img className="image" src={order.img} alt="" />
                </td>
                <td>{order.title}</td>
                <td>{order.price}</td>
                <td>
                  <img
                    className="orderContact"
                    src={messageIcon}
                    alt=""
                    onClick={() => handleContact(order)}
                  />
                </td>
              </tr>
            ))}
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
