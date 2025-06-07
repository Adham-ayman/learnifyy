import { Router } from "express";
import * as validators from "./auth.validation.js"
import { validation } from "../../Middleware/validation/validation.js";
import * as signUpService from "./service/signup.js";
import * as signInService from "./service/signin.js";
import { loginLimiter, otpRequestLimiter, passwordResetLimiter } from "../../Middleware/rateLimit/rateLimiter.js";
import { authentication } from "../../Middleware/authentication/authentication.js";



 const authRouter = Router()


 authRouter.post('/signup',validation(validators.signup),signUpService.signup)
 authRouter.patch("/confirm-email",validation(validators.confirmemail), signUpService.confirmEmail);
 authRouter.post("/resend-otp",validation(validators.resendOtp),otpRequestLimiter ,signUpService.resendOtp);
 authRouter.post("/forget-password",validation(validators.resendOtp), signUpService.forgetPassword);
 authRouter.patch("/reset-password",validation(validators.resetPassword),passwordResetLimiter ,signUpService.resetPassword);
 authRouter.post("/signup-google",validation(validators.gmailSignin), signUpService.signupWithGmail);
 authRouter.post("/login",validation(validators.login),loginLimiter,signInService.login);
 authRouter.get("/logout", authentication(), signInService.logout);




export default authRouter;