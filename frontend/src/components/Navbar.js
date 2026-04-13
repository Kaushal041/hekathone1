import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import profilePic from "../assets/undraw_Male_avatar.png";
import logo from "../assets/logo.png";
import newRequest from "../utils/newRequest";

function Navbar() {
  const [open, setOpen] = useState(false);

  // const currentUser = null;

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await newRequest.post("/auth/logout");
      localStorage.setItem("currentUser", null);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="navbar">
      <div className="navContainer">
        <div className="logo">
          <Link className="link" to="/">
            <img className="logoImg" src={logo} alt="" />
            <div className="brandText">
              <span className="brandName">TaskLink</span>
              <span className="brandTagline">Find skilled help instantly</span>
            </div>
          </Link>
        </div>
        <div className="links">
          {/* <Link className="nav_links" to="/">
            Hire Developers
          </Link> */}
          <Link className="nav_links" to="/gigs?cat">
            Browse Tasks
          </Link>
          {!currentUser?.isSeller && (
            <Link className="nav_links" to="/register">
              Become a Worker
            </Link>
          )}
          {currentUser ? (
            <div className="navUser" onClick={() => setOpen(!open)}>
              <img src={profilePic} alt="" />
              <span className="nav_links">{currentUser?.username}</span>
              {open && (
                <div className="options">
                  {currentUser.isSeller && (
                    <>
                      <Link className="options_link" to="/myGigs">
                        My Dashboard
                      </Link>
                      <Link className="options_link" to="/add">
                        Post Job
                      </Link>
                    </>
                  )}
                  <Link className="options_link" to="/orders">
                    Bookings
                  </Link>
                  <Link className="options_link" to="/messages">
                    Messages
                  </Link>
                  <Link className="options_link" onClick={handleLogout}>
                    Logout
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="nav_links" to="/login">
                Sign in
              </Link>
              <Link className="link" to="/register">
                <button className="Buttons">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
