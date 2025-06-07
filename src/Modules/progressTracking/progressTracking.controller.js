import { Router } from "express";
import { authentication, authorization } from "../../Middleware/authentication/authentication.js";
import * as PTservice  from "./service/p.t.service.js";
import { roletypes } from "../../DB/models/user.model.js";


const progressTrackingRouter = Router({ mergeParams: true });

progressTrackingRouter.get("/my", authentication(),PTservice.getProgressByUser); 
progressTrackingRouter.get("/",authentication() ,PTservice.getProgress); 
progressTrackingRouter.patch("/:lectureId",authentication(), PTservice.updateProgress); 
progressTrackingRouter.delete("/",authentication(), PTservice.deleteProgress); 
progressTrackingRouter.get("/percentage",authentication(), PTservice.getCourseCompletionPercentage); 
progressTrackingRouter.get("/all",authentication(),authorization([roletypes.admin,roletypes.instructor])
,PTservice.getAllProgress); 
export default progressTrackingRouter;