import React, { useState } from "react";
import "../styles/Gig.css";
import clock from "../assets/clock.png";
import recycle from "../assets/recycle.png";
import check from "../assets/check.png";
import star from "../assets/star.png";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import newRequest from "../utils/newRequest";
import RankedWorkers from "../components/RankedWorkers";

function Gig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const queryClient = useQueryClient();
  const [contactError, setContactError] = useState("");

  const { isLoading, error, data } = useQuery({
    queryKey: ["gig"],
    queryFn: () =>
      newRequest.get(`/gigs/single/${id}`).then((res) => {
        return res.data;
      }),
  });

  const sellerId = data?.userId;

  const { data: recommendationData } = useQuery({
    queryKey: ["recommendation", id],
    queryFn: () =>
      newRequest.get(`/jobs/${id}/recommendation`).then((res) => {
        return res.data;
      }),
    enabled: !!id,
  });
  const rankedWorkers = recommendationData?.rankedWorkers || [];

  const { data: sellerData } = useQuery({
    queryKey: ["gigSeller", sellerId],
    queryFn: () =>
      newRequest.get(`/users/${sellerId}`).then((res) => {
        return res.data;
      }),
    enabled: !!sellerId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const conversationId = data.userId + currentUser._id;

      try {
        const res = await newRequest.get(`/conversations/single/${conversationId}`);
        return res.data;
      } catch (err) {
        if (err.response?.status === 404) {
          const res = await newRequest.post("/conversations", {
            to: data.userId,
          });
          return res.data;
        }
        throw err;
      }
    },
    onSuccess: (conversation) => {
      setContactError("");
      queryClient.invalidateQueries(["conversations"]);
      navigate(`/message/${conversation.id}`);
    },
    onError: (err) => {
      setContactError(
        err?.response?.data ||
          err?.message ||
          "Unable to start conversation right now."
      );
    },
  });

  const handleContact = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.isSeller) {
      setContactError("Please use a customer account to contact this provider.");
      return;
    }

    if (currentUser._id === data.userId) {
      setContactError("You cannot contact yourself.");
      return;
    }

    mutation.mutate();
  };

  // const userId = data?.userId;

  // const {
  //   isLoading: isLoadingUser,
  //   error: errorUser,
  //   data: dataUser,
  // } = useQuery({
  //   queryKey: ["user"],

  //   queryFn: () =>
  //     newRequest.get(`/users/${userId}`).then((res) => {
  //       return res.data;
  //     }),

  //   enabled: !!userId,
  // });

  return (
    <div className="gig">
      {isLoading ? (
        <div className="gigContainer">
          <div className="gigLeft">
            <div className="gig-skeleton-breadcrumbs" />
            <div className="gig-skeleton-title" />
            <div className="gigUser">
              <div className="gig-skeleton-avatar" />
              <div className="gig-skeleton-text gig-skeleton-short" />
              <div className="gig-skeleton-stars" />
            </div>
            <div className="gigSlider">
              <div className="gig-skeleton-img" />
            </div>
            <div className="gig-skeleton-section" />
            <div className="gig-skeleton-section" />
          </div>
          <div className="gigRight">
            <div className="gig-skeleton-price" />
            <div className="gig-skeleton-shortdesc" />
            <div className="gig-skeleton-details" />
            <div className="gig-skeleton-features" />
            <div className="gig-skeleton-button" />
          </div>
        </div>
      ) : error ? (
        "Something went wrong!"
      ) : (
        <div className="gigContainer">
          <div className="gigLeft">
            <span className="breadcrumbs">
              TaskLink {">"} {data.cat} {">"} {sellerData?.username || "Provider"}
            </span>
            <h1>{data.title}</h1>
            <div className="gigUser">
              <img
                className="pp"
                  src={sellerData?.img || data.cover}
                alt=""
              />
                <span>{sellerData?.username || "Provider"}</span>
              <div className="gigStars">
                <img src={star} alt="" />
                <span>{data.totalStars}</span>
              </div>
            </div>
            <div className="gigSlider">
              <img src={data.cover} alt="" />
            </div>
            <h2>About This Service</h2>
            <p>{data.desc}</p>
            <div className="seller">
              <h2>About The Provider</h2>
              <div className="gigSellerUser">
                <img
                  className="gigSellerImg"
                  src={sellerData?.img || data.cover}
                  alt=""
                />
                <div className="gigInfo">
                  <span>{sellerData?.username || "Provider"}</span>
                  <div className="gigStars">
                    <img src={star} alt="" />
                    <span>{data.totalStars}</span>
                  </div>
                  <button className="Buttons1" onClick={handleContact}>
                    Contact Provider
                  </button>
                  {contactError && <p>{contactError}</p>}
                </div>
              </div>
              <div className="box">
                <div className="boxItems">
                  <div className="boxItem">
                    <span>From</span>
                    <span>INDIA</span>
                  </div>
                  <div className="boxItem">
                    <span>Member since</span>
                    <span>Aug 2023</span>
                  </div>
                  <div className="boxItem">
                    <span>Avg. response time</span>
                    <span>4 hours</span>
                  </div>
                  <div className="boxItem">
                    <span>Last delivery</span>
                    <span>Last completed micro job: 1 day ago</span>
                  </div>
                  <div className="boxItem">
                    <span>Languages</span>
                    <span>English</span>
                  </div>
                </div>
                <hr />
                <p>{data.desc}</p>
              </div>
            </div>
            <div className="reviews">
              <h2>Customer Ratings</h2>
              <div className="reviewsItem">
                <div className="reviewUser">
                  <img
                    className="reviewUserpp"
                    src="https://images.pexels.com/photos/839586/pexels-photo-839586.jpeg?auto=compress&cs=tinysrgb&w=1600"
                    alt=""
                  />
                  <div className="gigInfo">
                    <span>Garner David</span>
                    <div className="country">
                      <span>United States</span>
                    </div>
                  </div>
                </div>
                <div className="gigStars">
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <span>4</span>
                </div>
                <p>
                  Great experience. The provider communicated clearly, arrived
                  on time, and completed the task exactly as requested. I would
                  definitely hire again for similar micro jobs.
                </p>
              </div>
              <hr />
              <div className="reviewsItem">
                <div className="reviewUser">
                  <img
                    className="reviewUserpp"
                    src="https://images.pexels.com/photos/4124367/pexels-photo-4124367.jpeg?auto=compress&cs=tinysrgb&w=1600"
                    alt=""
                  />
                  <div className="gigInfo">
                    <span>Sidney Owen</span>
                    <div className="country">
                      <span>Germany</span>
                    </div>
                  </div>
                </div>
                <div className="gigStars">
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <span>5</span>
                </div>
                <p>
                  Very professional service and quick turnaround. The quality
                  matched the agreed scope and pricing was fair.
                </p>
              </div>
              <hr />
              <div className="reviewsItem">
                <div className="reviewUser">
                  <img
                    className="reviewUserpp"
                    src="https://images.pexels.com/photos/842980/pexels-photo-842980.jpeg?auto=compress&cs=tinysrgb&w=1600"
                    alt=""
                  />
                  <div className="gigInfo">
                    <span>Lyle Giles </span>
                    <div className="country">
                      <span>United States</span>
                    </div>
                  </div>
                </div>
                <div className="gigStars">
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <img src={star} alt="" />
                  <span>5</span>
                </div>
                <p>
                  Smooth process from start to finish. Strong communication,
                  transparent updates, and excellent completion quality.
                </p>
              </div>
            </div>

            <RankedWorkers rankedWorkers={rankedWorkers} />
          </div>
          <div className="gigRight">
            <div className="gigPrice">
              <h3>{data.cat}</h3>
              <h2>INR {data.price}</h2>
            </div>
            <p>{data.shortDesc}</p>
            <div className="gigDetails">
              <div className="gigItem">
                <img src={clock} alt="" height="20px" />
                <span>Estimated completion: 2 days</span>
              </div>
              <div className="gigItem">
                <img src={recycle} alt="" height="20px" />
                <span>{data.revisionNumber} revision(s)</span>
              </div>
            </div>
            <div className="features">
              <div className="gigItem">
                <img className="checkIcon" src={check} alt="" />
                <span>Skill-based task delivery</span>
              </div>
              <div className="gigItem">
                <img className="checkIcon" src={check} alt="" />
                <span>Progress and status updates</span>
              </div>
              <div className="gigItem">
                <img className="checkIcon" src={check} alt="" />
                <span>Secure payment confirmation</span>
              </div>
              <div className="gigItem">
                <img className="checkIcon" src={check} alt="" />
                <span>Reliability and completion tracking</span>
              </div>
            </div>
            <Link to={`/pay/${id}`}>
              <button className="continueButton">Book This Service</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gig;
