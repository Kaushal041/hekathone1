import React from "react";
import "../styles/Home.css";
import { Link } from "react-router-dom";
import { getCategoryImage } from "../utils/categoryMedia";

const categories = [
  {
    name: "Repair",
    icon: "🛠",
    image: getCategoryImage("Repair"),
  },
  {
    name: "Plumbing",
    icon: "🚰",
    image: getCategoryImage("Plumbing"),
  },
  {
    name: "Tutoring",
    icon: "📘",
    image: getCategoryImage("Tutoring"),
  },
  {
    name: "Design",
    icon: "🎨",
    image: getCategoryImage("Design"),
  },
  {
    name: "Delivery",
    icon: "🚚",
    image: getCategoryImage("Delivery"),
  },
  {
    name: "Tech Help",
    icon: "💻",
    image: getCategoryImage("Tech Help"),
  },
];

const featuredWorkers = [
  { name: "Ravi Sharma", skill: "Home Repairs", rating: 4.9, jobs: 186 },
  { name: "Neha Verma", skill: "Math Tutoring", rating: 4.8, jobs: 142 },
  { name: "Arjun Patel", skill: "Tech Setup", rating: 4.9, jobs: 211 },
];

function Home() {
  return (
    <>
      <div className="homeContainer">
        <div className="homeTitle">
          Get Small Tasks Done Fast
        </div>
        <div className="homeDesc">
          Find trusted workers near you for any job.
        </div>
        <div className="heroActions">
          <Link to="/add">
            <button className="homeButtons">Post a Job</button>
          </Link>
          <Link to="/gigs?cat">
            <button className="homeButtons secondary">Find Work</button>
          </Link>
        </div>
      </div>

      <section className="homeSection">
        <h2>Categories</h2>
        <div className="categoryGrid">
          {categories.map((item) => (
            <Link
              key={item.name}
              to={`/gigs?cat=${encodeURIComponent(item.name)}`}
              className="categoryCard"
            >
              <img src={item.image} alt={item.name} />
              <div className="categoryMeta">
                <span className="categoryIcon">{item.icon}</span>
                <span>{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="homeSection howItWorks">
        <h2>How It Works</h2>
        <div className="stepsGrid">
          <div className="stepCard">
            <span className="stepNumber">1</span>
            <h3>Post Job</h3>
            <p>Describe your task, budget, skills needed, location, and deadline.</p>
          </div>
          <div className="stepCard">
            <span className="stepNumber">2</span>
            <h3>Get Bids</h3>
            <p>Receive proposals from workers with ratings and completion records.</p>
          </div>
          <div className="stepCard">
            <span className="stepNumber">3</span>
            <h3>Choose Best Worker</h3>
            <p>Compare scores and accept the most suitable bid confidently.</p>
          </div>
        </div>
      </section>

      <section className="homeSection">
        <h2>Featured Workers</h2>
        <div className="workersGrid">
          {featuredWorkers.map((worker) => (
            <div className="workerCard" key={worker.name}>
              <div className="workerTop">
                <div>
                  <h3>{worker.name}</h3>
                  <p>{worker.skill}</p>
                </div>
                <span className="topBadge">Top Rated</span>
            </div>
              <div className="workerStats">
                <span>⭐ {worker.rating}</span>
                <span>{worker.jobs} jobs completed</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
