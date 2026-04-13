import React from "react";
import { Link } from "react-router-dom";
import "../styles/GigCard.css";
import starImg from "../assets/star.png";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../utils/newRequest";
import avatarImg from "../assets/undraw_Male_avatar.png";
import { getCategoryImage } from "../utils/categoryMedia";

const GigCard = ({ item }) => {
  const cardImage = item?.cover || getCategoryImage(item?.cat, "https://images.pexels.com/photos/5077393/pexels-photo-5077393.jpeg?auto=compress&cs=tinysrgb&w=1200");

  const { isLoading, error, data: userData } = useQuery({
    queryKey: [item.userId],
    queryFn: () =>
      newRequest.get(`/users/${item.userId}`).then((res) => {
        return res.data;
      }),
  });

  const PlaceholderCard = () => (
    <div className="gigCard placeholder">
      <div className="gigImg placeholder-img" />
      <div className="info">
        <div className="cardUser">
          <div className="placeholder-avatar" />
          <span className="placeholder-text short" />
        </div>
        <p className="placeholder-text long" />
        <div className="star">
          <div>
            <div className="starImg placeholder-star" />
            <span className="placeholder-text short" />
          </div>
          <div className="price">
            <span className="placeholder-text tiny" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Link to={`/gig/${item._id}`} className="link">
      {isLoading ? (
        <PlaceholderCard />
      ) : error ? (
        "Something went wrong!"
      ) : (
        <div className="gigCard">
          <img className="gigImg" src={cardImage} alt={item?.cat || "Job"} />
          <div className="info">
            <div className="cardUser">
              <img
                src={userData?.img || avatarImg}
                alt=""
              />
              <span>{userData?.username || "Provider"}</span>
            </div>

            <p>{item.title}</p>
            <div className="star">
              <div>
                <img className="starImg" src={starImg} alt="" />
                <span>{item.totalStars}</span>
              </div>
              <div className="price">
                <span>STARTING PRICE</span>
                <h2>INR {item.price}</h2>
              </div>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
};

export default GigCard;
