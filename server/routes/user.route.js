import express from "express";
import {
	deleteUser,
	getAllocatedJobs,
	getSameCityWorkers,
	getUser,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.delete("/:id", verifyToken, deleteUser); //verifyToken will call jwt middleware to check token is valid, than delete function will called
router.get("/:id/allocated-jobs", verifyToken, getAllocatedJobs);
router.get("/:id/same-city-workers", verifyToken, getSameCityWorkers);
router.get("/:id", getUser);

export default router;
