import { Router } from "express";
import { authentication, authorization } from "../../Middleware/authentication/authentication.js";
import { roletypes } from "../../DB/models/user.model.js";
import { createBasicRoadmap, deleteRoadmap, enrollInRoadmap, getAllBasicRoadmaps, getRoadmapById, getUserEnrolledBasicRoadmaps, searchRoadmaps, updateRoadmap, validateCreateBasicRoadmap } from "./service/basic.service.js";
import { generateCustomizedRoadmap, getUserCustomizedRoadmaps } from "./service/customized.service.js";
import { fileValidationTypes } from "../../Utils/multer/local/multer.local.js";
import { uploadCloudFile } from "../../Utils/multer/multer.cloud.js";

const roadmapRouter = Router();
roadmapRouter.post(
  '/',
  authentication(),
  authorization(['instructor', 'admin']),
  uploadCloudFile(fileValidationTypes.image).fields([{ name: "image", maxCount: 1 }]),
  validateCreateBasicRoadmap,
  createBasicRoadmap
);


// Create and auto-enroll a customized roadmap
roadmapRouter.post('/customized', authentication(), generateCustomizedRoadmap);

// Get all customized roadmaps for the authenticated user
roadmapRouter.get('/customized', authentication(), getUserCustomizedRoadmaps);

// Enroll in a roadmap
roadmapRouter.post('/enroll/:roadmapId', authentication(), enrollInRoadmap);

// Delete a roadmap
roadmapRouter.delete('/:roadmapId', authentication(), deleteRoadmap);

// Update a roadmap with optional image
roadmapRouter.put(
  '/:roadmapId',
  authentication(),
  authorization([roletypes.admin]),
  uploadCloudFile(fileValidationTypes.image).fields([{ name: "image", maxCount: 1 }]),
  updateRoadmap
);

// Get all basic roadmaps
roadmapRouter.get('/basic', getAllBasicRoadmaps);

// Search roadmaps
roadmapRouter.get('/search', searchRoadmaps);

// Get a roadmap by ID
roadmapRouter.get('/:roadmapId', getRoadmapById);

// Get enrolled basic roadmaps
roadmapRouter.get('/enrolled/basic', authentication(), getUserEnrolledBasicRoadmaps);

export default roadmapRouter;