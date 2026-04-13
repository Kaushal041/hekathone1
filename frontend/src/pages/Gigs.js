import React, { useRef, useEffect, useState } from "react";
// import { gigs } from "../data";
import GigCard from "../components/GigCard";
import "../styles/Gigs.css";
import downIcon from "../assets/down.png";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../utils/newRequest";
import { useLocation } from "react-router-dom";

function Gigs() {
  const [sort, setSort] = useState("sales");
  const [open, setOpen] = useState(false);
  const minRef = useRef();
  const maxRef = useRef();

  const { search } = useLocation();

  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ["gigs"],

    queryFn: () => {
      const params = new URLSearchParams(search);

      if (minRef.current?.value) {
        params.set("min", minRef.current.value);
      } else {
        params.delete("min");
      }

      if (maxRef.current?.value) {
        params.set("max", maxRef.current.value);
      } else {
        params.delete("max");
      }

      params.set("sort", sort);

      return newRequest.get(`/gigs?${params.toString()}`).then((res) => {
        return res.data;
      });
    },
  });

  console.log(data);

  const reSort = (type) => {
    setSort(type);
    setOpen(false);
  };

  useEffect(() => {
    refetch();
  }, [sort, refetch]);

  const apply = () => {
    refetch();
  };

  return (
    <div className="gigs">
      <div className="gigsContainer">
        <span className="breadcrumbs">TaskLink {">"} Micro Jobs Marketplace</span>
        <h1>Micro Jobs Marketplace</h1>
        <p>
          Find trusted providers for repairs, tutoring, design, and technical help.
        </p>
        <div className="menu">
          <div className="left">
            <span>Budget (INR)</span>
            <input ref={minRef} type="number" placeholder="min amount" />
            <input ref={maxRef} type="number" placeholder="max amount" />
            <button className="budgetbutton" onClick={apply}>
              Apply Filters
            </button>
          </div>
          <div className="right">
            <span className="sortBy">Sort by:</span>
            <span className="sortType" onClick={() => setOpen(!open)}>
              {sort === "sales" ? "Top Rated" : "Newest"}

              <img src={downIcon} alt="" onClick={() => setOpen(!open)} />
            </span>
            {open && (
              <div className="rightMenu">
                {sort === "sales" ? (
                  <span onClick={() => reSort("createdAt")}>Newest</span>
                ) : (
                  <span onClick={() => reSort("sales")}>Top Rated</span>
                )}
                <span onClick={() => reSort("sales")}>Popular</span>
              </div>
            )}
          </div>
        </div>
        {/* <div className="cards">
          {gigs.map((gig) => (
            <GigCard key={gig.id} item={gig} />
          ))}
        </div> */}

        <div className="cards">
          {isLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div className="gigCard placeholder" key={idx}>
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
              ))
            : error
            ? "Something went wrong!"
            : data?.length === 0
            ? "No providers found for this filter. Try broadening your budget or posting a new service."
            : data.map((gig) => <GigCard key={gig._id} item={gig} />)}
        </div>
      </div>
    </div>
  );
}

export default Gigs;
