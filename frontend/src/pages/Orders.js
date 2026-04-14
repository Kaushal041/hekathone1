import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Orders.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import newRequest from "../utils/newRequest";
import messageIcon from "../assets/chat-icon.png";

const Orders = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const queryClient = useQueryClient();
  const [onlySameCity, setOnlySameCity] = useState(false);
  const [claimToast, setClaimToast] = useState("");

  const navigate = useNavigate();
  const { isLoading, error, data } = useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      newRequest.get(`/orders`).then((res) => {
        return res.data;
      }),
  });

  const { data: allocatedData, isLoading: allocatedLoading } = useQuery({
    queryKey: ["allocatedJobs", currentUser?._id],
    queryFn: () =>
      newRequest.get(`/users/${currentUser._id}/allocated-jobs`).then((res) => res.data),
    enabled: !!currentUser?._id && !!currentUser?.isSeller,
  });

  const { data: sameCityData, isLoading: sameCityLoading } = useQuery({
    queryKey: ["sameCityWorkers", currentUser?._id],
    queryFn: () =>
      newRequest.get(`/users/${currentUser._id}/same-city-workers`).then((res) => res.data),
    enabled: !!currentUser?._id && !currentUser?.isSeller,
  });

  const claimMutation = useMutation({
    mutationFn: (job) =>
      newRequest.post("/bids", {
        jobId: job.jobId,
        bidAmount: job.budget,
        estimatedTime: "2 days",
        proposal: `Location-based allocation claim for ${job.title}`,
      }),
    onSuccess: (_data, job) => {
      queryClient.invalidateQueries(["allocatedJobs", currentUser?._id]);
      queryClient.invalidateQueries(["recommendation", job.jobId]);
      setClaimToast(`Job claimed successfully: ${job.title}`);
    },
  });

  useEffect(() => {
    if (!claimToast) return;
    const timer = setTimeout(() => {
      setClaimToast("");
    }, 2400);

    return () => clearTimeout(timer);
  }, [claimToast]);

  const filteredAllocatedJobs = useMemo(() => {
    const jobs = allocatedData?.jobs || [];
    if (!onlySameCity) return jobs;
    return jobs.filter((job) => Number(job.locationScore) >= 100);
  }, [allocatedData?.jobs, onlySameCity]);

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

  const handleContactWorker = async (worker) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const conversationId = String(worker.workerId) + String(currentUser._id);

    try {
      const res = await newRequest.get(`/conversations/single/${conversationId}`);
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      if (err.response?.status === 404) {
        const res = await newRequest.post(`/conversations/`, {
          to: worker.workerId,
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
                  <h3>Allocated Jobs</h3>
                  <p>{allocatedData?.jobs?.length || 0}</p>
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
                  <h3>Same City Workers</h3>
                  <p>{sameCityData?.workers?.length || 0}</p>
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

          {currentUser.isSeller && (
            <div className="allocatedSection">
              <h2 className="tableHeading">Location-Based Work Allocation</h2>
              <div className="allocationToolbar">
                <label className="sameCityToggle">
                  <input
                    type="checkbox"
                    checked={onlySameCity}
                    onChange={(e) => setOnlySameCity(e.target.checked)}
                  />
                  Only same city
                </label>
              </div>

              {claimToast && <div className="claimToast">{claimToast}</div>}

              {allocatedLoading ? (
                <div className="loadingPlaceholder">
                  <div className="spinner"></div>
                  <div>Finding jobs near your location...</div>
                </div>
              ) : filteredAllocatedJobs.length > 0 ? (
                <div className="allocatedGrid">
                  {filteredAllocatedJobs.map((job) => (
                    <div className="allocatedCard" key={job.jobId}>
                      <img src={job.cover} alt={job.title} className="allocatedImg" />
                      <div className="allocatedContent">
                        <div className="allocatedHeader">
                          <h3>{job.title}</h3>
                          <span className="allocationBadge">{job.locationScore}% Match</span>
                        </div>
                        <div className="matchTypeRow">
                          <span className="matchTypeBadge">{job.locationMatchType || "Nearby"}</span>
                        </div>
                        <p>{job.category}</p>
                        <p>Budget: INR {job.budget}</p>
                        <p>Job Location: {job.jobLocation || "Not specified"}</p>
                        <p className="allocationReason">{job.allocationReason}</p>
                        <button
                          type="button"
                          className="claimJobBtn"
                          disabled={job.alreadyClaimed || claimMutation.isLoading}
                          onClick={() => claimMutation.mutate(job)}
                        >
                          {job.alreadyClaimed
                            ? `Claimed${job.bidStatus ? ` (${job.bidStatus})` : ""}`
                            : "Claim Job"}
                        </button>
                        {claimMutation.isError && (
                          <p className="claimError">
                            {claimMutation.error?.response?.data ||
                              "Unable to claim this job right now."}
                          </p>
                        )}
                        <Link className="viewJobBtn" to={`/gig/${job.jobId}`}>
                          View Job
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="loadingPlaceholder">
                  <div>
                    {onlySameCity
                      ? "No same-city jobs found right now."
                      : "No nearby work found yet for your location."}
                  </div>
                </div>
              )}
            </div>
          )}

          {!currentUser.isSeller && (
            <div className="allocatedSection">
              <h2 className="tableHeading">Same City Workers</h2>
              {sameCityLoading ? (
                <div className="loadingPlaceholder">
                  <div className="spinner"></div>
                  <div>Finding workers in your city...</div>
                </div>
              ) : sameCityData?.workers?.length > 0 ? (
                <div className="allocatedGrid">
                  {sameCityData.workers.map((worker) => (
                    <div className="allocatedCard" key={worker.workerId}>
                      {worker.cover ? (
                        <img src={worker.cover} alt={worker.username} className="allocatedImg" />
                      ) : (
                        <div className="allocatedImg noImage">No image</div>
                      )}
                      <div className="allocatedContent">
                        <div className="allocatedHeader">
                          <h3>{worker.username}</h3>
                          <span className="allocationBadge">⭐ {worker.rating.toFixed(1)}</span>
                        </div>
                        <div className="matchTypeRow">
                          <span className="matchTypeBadge">Same City</span>
                        </div>
                        <p>{worker.category}</p>
                        <p>{worker.serviceTitle}</p>
                        <p>Completed Jobs: {worker.completedJobs}</p>
                        <p>Location: {worker.location}</p>
                        {worker.skills?.length > 0 && (
                          <p className="allocationReason">
                            Skills: {worker.skills.slice(0, 3).join(", ")}
                          </p>
                        )}
                        <button
                          type="button"
                          className="claimJobBtn"
                          onClick={() => handleContactWorker(worker)}
                        >
                          Contact Worker
                        </button>
                        {worker.gigId && (
                          <Link className="viewJobBtn" to={`/gig/${worker.gigId}`}>
                            View Service
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="loadingPlaceholder">
                  <div>No same-city workers found yet. Update your location and try again.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
