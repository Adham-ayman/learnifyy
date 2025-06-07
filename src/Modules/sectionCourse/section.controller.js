import { Router } from "express";
import { authentication, authorization } from "../../Middleware/authentication/authentication.js";
import { validation } from "../../Middleware/validation/validation.js";
import * as sectionService from "./service/section.service.js";
import { roletypes } from "../../DB/models/user.model.js";
import { isCourseInstructor } from "../../Middleware/CheckRole/checkRole.js";
import lectureRouter from "../lectures/lecture.controller.js";


const sectionRouter = Router({ mergeParams: true }); 


sectionRouter.use('/:sectionId/lecture',lectureRouter)


sectionRouter.post(
    "/create",
    authentication(),
    authorization([roletypes.instructor]), 
    isCourseInstructor,
    sectionService.createSection           
    
  );

  sectionRouter.get(
    "/",
    authentication(),
    authorization([roletypes.instructor, roletypes.admin]),
    sectionService.getSectionsByCourseId 
  );

  sectionRouter.put(
    "/:sectionId",
    authentication(),
    authorization([roletypes.instructor]),
    isCourseInstructor, 
    sectionService.updateSection
  );
  sectionRouter.delete(
    "/:sectionId",
    authentication(),
    authorization([roletypes.instructor]),
    isCourseInstructor,
    sectionService.deleteSection
  );


  export default sectionRouter;