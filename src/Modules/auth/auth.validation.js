import Joi from "joi";
import { generalFields } from "../../Middleware/validation/validation.js";

export const signup =Joi.object().keys({
    firstName:generalFields.userName.required(),
    lastName:generalFields.userName.required(),
    password:generalFields.password.required(),
    email:generalFields.email.required(),
    confirmpassword:generalFields.confirmpassword.valid(Joi.ref("password")).required(),
    gender:generalFields.gender,
    DOB:generalFields.DOB,
    phone:generalFields.phone.required()
    
}).strict(true).options({allowUnknown:false}).required()

export const confirmemail =Joi.object().keys({
    email:generalFields.email.required(),
    confirmEmailOtp:generalFields.Otp.required()
    
}).options({allowUnknown:false}).required()

export const login  =Joi.object().keys({
    email:generalFields.email.required(),
    password:generalFields.password.required()
}).options({allowUnknown:false}).required()

export const resendOtp =Joi.object().keys({
    email:generalFields.email.required(),
}).options({allowUnknown:false}).required()

export const resetPassword =Joi.object().keys({
    email:generalFields.email.required(),
    forgetPasswordOtp:generalFields.Otp.required(),
    newpassword:generalFields.password.required(),
    confirmpassword:generalFields.confirmpassword.valid(Joi.ref("newpassword")).required(),
}).options({allowUnknown:false}).required()

export const idParam = Joi.object().keys({
    id: generalFields.Id.required(),
  }).options({allowUnknown:false}).required()


  export const gmailSignin = Joi.object().keys({
    idToken: Joi.string().required(),
  }).options({allowUnknown:false}).required()
  