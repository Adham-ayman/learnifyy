import { Router } from "express";
import { authentication, authorization } from "../../Middleware/authentication/authentication.js";
import { uploadCloudFile } from "../../Utils/multer/multer.cloud.js";
import { fileValidationTypes } from "../../Utils/multer/local/multer.local.js";
import * as userService from "./service/profile.service.js";
import { validation } from "../../Middleware/validation/validation.js";
import * as validators from "./user.validation.js";
import * as adminService from "./service/admin.service.js";
import { roletypes } from "../../DB/models/user.model.js";

const userRouter = Router();
userRouter.get("/profile", authentication(), userService.getProfile);
userRouter.put(
  "/profile",
  authentication(),
  uploadCloudFile(fileValidationTypes.image).single("image"),
  validation(validators.updateProfile),
  userService.updateProfile
);
userRouter.patch(
  "/change-password",
  authentication(),
  validation(validators.changePassword),
  userService.changePassword
);
userRouter.get("/enrolled-courses", authentication(), userService.getEnrolledCourses);
userRouter.get("/deactivate", authentication(), userService.deactivateAccount); 

userRouter.get("/",  authentication(), authorization([roletypes.admin]),adminService.getAllUsers);


userRouter.get("/:userId", authentication(), authorization([roletypes.admin]), adminService.getUserById);

export default userRouter;
