import React, { useReducer, useState } from "react";
import { gigReducer, INITIAL_STATE } from "../utils/gigReducer";
// import upload from "../../utils/upload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import newRequest from "../utils/newRequest";
import "../styles/Add.css";
import { getCategoryImage } from "../utils/categoryMedia";
import { useNavigate } from "react-router-dom";

const COVER_OPTIONS = [
  {
    name: "Home Repairs",
    url: getCategoryImage("Home Repairs"),
  },
  {
    name: "Plumbing",
    url: getCategoryImage("Plumbing"),
  },
  {
    name: "Tutoring",
    url: getCategoryImage("Tutoring"),
  },
  {
    name: "Graphic Design",
    url: getCategoryImage("Graphic Design"),
  },
  {
    name: "Technical Help",
    url: getCategoryImage("Technical Help"),
  },
];

const Add = () => {
  // const [singleFile, setSingleFile] = useState(undefined);
  // const [files, setFiles] = useState([]);
  // const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(""); // Clear previous errors

    // Required fields validation
    const requiredFields = [
      { key: "title", label: "Title" },
      { key: "cat", label: "Category" },
      { key: "cover", label: "Cover Image" },
      { key: "desc", label: "Description" },
      { key: "price", label: "Price" },
    ];

    const missing = requiredFields.filter(
      (field) =>
        state[field.key] === "" ||
        state[field.key] === 0 ||
        state[field.key] === undefined
    );

    if (missing.length > 0) {
      setErrorMsg(
        `Please fill in the following required fields: ${missing
          .map((f) => f.label)
          .join(", ")}`
      );
      return;
    }

    if (!requiredSkills || !location || !deadline) {
      setErrorMsg("Please fill Required Skills, Location, and Deadline.");
      return;
    }

    if (Number(state.price) <= 0) {
      setErrorMsg("Budget must be greater than 0.");
      return;
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      setErrorMsg("Deadline must be a future date.");
      return;
    }

    const dayDiff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    const deliveryDays = Number.isFinite(dayDiff) && dayDiff > 0 ? dayDiff : 1;

    const payload = {
      ...state,
      shortTitle: requiredSkills,
      shortDesc: `Location: ${location}`,
      deliveryTime: deliveryDays,
      revisionNumber: 1,
      desc: `${state.desc}\n\nRequired Skills: ${requiredSkills}\nLocation: ${location}\nDeadline: ${deadline}`,
    };

    mutation.mutate(payload);
    // navigate("/mygigs")
  };

  const [state, dispatch] = useReducer(gigReducer, {
    ...INITIAL_STATE,
    cat: "Home Repairs",
    cover: COVER_OPTIONS[0].url,
  });

  const handleChange = (e) => {
    dispatch({
      type: "CHANGE_INPUT",
      payload: { name: e.target.name, value: e.target.value },
    });
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    dispatch({
      type: "CHANGE_INPUT",
      payload: { name: "cat", value: selectedCategory },
    });
  };

  const handleCoverChange = (e) => {
    dispatch({
      type: "CHANGE_INPUT",
      payload: { name: "cover", value: e.target.value },
    });
  };

  // const handleFeature = (e) => {
  //   e.preventDefault();
  //   dispatch({
  //     type: "ADD_FEATURE",
  //     payload: e.target[0].value,
  //   });
  //   e.target[0].value = "";
  // };

  // const handleUpload = async () => {
  //   setUploading(true);
  //   try {
  //     const cover = await upload(singleFile);

  //     const images = await Promise.all(
  //       [...files].map(async (file) => {
  //         const url = await upload(file);
  //         return url;
  //       })
  //     );
  //     setUploading(false);
  //     dispatch({ type: "ADD_IMAGES", payload: { cover, images } });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (gig) => {
      return newRequest.post("/gigs", gig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myGigs"]);
      navigate("/mygigs");
    },
  });

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   mutation.mutate(state);
  //   // navigate("/mygigs")
  // };

  return (
    <div className="add">
      <div className="container">
        <h1>Post a Job</h1>
        {errorMsg && (
          <div
            className="addError"
            style={{
              background: "#ffeaea",
              color: "#b00020",
              border: "1px solid #ffb3b3",
              padding: "14px 18px",
              marginBottom: "18px",
              borderRadius: "6px",
              textAlign: "center",
              fontSize: "1rem",
            }}
          >
            {errorMsg}
          </div>
        )}

        <div className="sections">
          <div className="info">
            <label htmlFor="">Job Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Need AC repair for home bedroom"
              onChange={handleChange}
              required
            />
            <label htmlFor="">Category</label>
            <select name="cat" id="cat" value={state.cat} onChange={handleCategoryChange}>
              <option value="Home Repairs">Home Repairs</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Tutoring">Tutoring</option>
              <option value="Graphic Design">Graphic Design</option>
              <option value="Technical Help">Technical Help</option>
            </select>
            <label htmlFor="">Category Photo</label>
            <select
              name="cover"
              value={state.cover}
              onChange={handleCoverChange}
            >
              {COVER_OPTIONS.map((option, idx) => (
                <option value={option.url} key={idx}>
                  {option.name}
                </option>
              ))}
            </select>
            {/* <div className="images">
              <div className="imagesInputs">
                <label htmlFor="">Cover Image</label>
                <input
                  type="file"
                  onChange={(e) => setSingleFile(e.target.files[0])}
                />
                <label htmlFor="">Upload Images</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                />
              </div>
              <button onClick={handleUpload}>
                {uploading ? "uploading" : "Upload"}
              </button>
            </div> */}
            <label htmlFor="">Description</label>
            <textarea
              name="desc"
              id=""
              placeholder="Explain task details, preferred timing, and expected outcome"
              cols="0"
              rows="16"
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <div className="details">
            <label htmlFor="">Budget (INR)</label>
            <input
              type="number"
              onChange={handleChange}
              name="price"
              placeholder="e.g. 1200"
              min="1"
              required
            />
            <label htmlFor="">Required Skills</label>
            <input
              type="text"
              value={requiredSkills}
              placeholder="e.g. AC servicing, wiring inspection"
              onChange={(e) => setRequiredSkills(e.target.value)}
              required
            />
            <label htmlFor="">Location</label>
            <input
              type="text"
              value={location}
              placeholder="e.g. Indore, Vijay Nagar"
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <label htmlFor="">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
        </div>
        <button className="createButton" onClick={handleSubmit}>
          Post Job
        </button>
      </div>
    </div>
  );
};

export default Add;
