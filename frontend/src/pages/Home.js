import React from "react";
import "../styles/Home.css";
import { Link } from "react-router-dom";
import { getCategoryImage } from "../utils/categoryMedia";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../utils/newRequest";

const categories = [
  {
    name: "Home Repairs",
    icon: "🛠",
    image: getCategoryImage("Home Repairs"),
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

function Home() {
  const { data: gigsData = [], isLoading: gigsLoading } = useQuery({
    queryKey: ["featuredWorkerGigs"],
    queryFn: () =>
      newRequest.get("/gigs?sort=sales").then((res) => {
        return res.data;
      }),
  });

  const { data: featuredWorkers = [], isLoading: workersLoading } = useQuery({
    queryKey: ["featuredWorkers", gigsData.length],
    enabled: gigsData.length > 0,
    queryFn: async () => {
      const workerPostMap = gigsData.reduce((acc, gig) => {
        const workerId = String(gig.userId);
        if (!acc[workerId]) {
          acc[workerId] = {
            posts: 0,
            totalSales: 0,
            categoryCount: {},
          };
        }

        acc[workerId].posts += 1;
        acc[workerId].totalSales += Number(gig.sales || 0);
        acc[workerId].categoryCount[gig.cat] =
          (acc[workerId].categoryCount[gig.cat] || 0) + 1;

        return acc;
      }, {});

      const rankedIds = Object.keys(workerPostMap)
        .sort((a, b) => {
          const aData = workerPostMap[a];
          const bData = workerPostMap[b];
          if (bData.posts !== aData.posts) return bData.posts - aData.posts;
          return bData.totalSales - aData.totalSales;
        })
        .slice(0, 8);

      const workers = await Promise.all(
        rankedIds.map(async (workerId) => {
          try {
            const user = await newRequest.get(`/users/${workerId}`).then((res) => res.data);
            const stats = workerPostMap[workerId];
            const topCategory = Object.entries(stats.categoryCount).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0];

            if (!user?.isSeller) return null;

            return {
              name: user.username,
              skill: topCategory || "General Services",
              rating: Number(user.rating || 4.5).toFixed(1),
              jobs: Number(user.completedJobs || stats.posts),
              posts: stats.posts,
            };
          } catch (_err) {
            return null;
          }
        })
      );

      return workers.filter(Boolean).slice(0, 3);
    },
  });

  const isFeaturedLoading = gigsLoading || workersLoading;

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
          {isFeaturedLoading &&
            [1, 2, 3].map((item) => (
              <div className="workerCard" key={`worker-skeleton-${item}`}>
                <div className="workerTop">
                  <div>
                    <h3>Loading...</h3>
                    <p>Fetching real worker posts</p>
                  </div>
                </div>
                <div className="workerStats">
                  <span>Loading score</span>
                  <span>Loading jobs</span>
                </div>
              </div>
            ))}

          {!isFeaturedLoading && featuredWorkers.length === 0 && (
            <div className="workerCard">
              <div className="workerTop">
                <div>
                  <h3>No workers yet</h3>
                  <p>Featured workers will appear after real job posts.</p>
                </div>
              </div>
            </div>
          )}

          {!isFeaturedLoading &&
            featuredWorkers.map((worker) => (
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
                <div className="workerMeta">{worker.posts} real posts</div>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}

export default Home;
