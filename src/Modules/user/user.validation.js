import Joi from "joi";
import { generalFields } from "../../Middleware/validation/validation.js";



export const updateProfile = Joi.object().keys({
    userName: generalFields.userName.optional(),
    phone: generalFields.phone.optional(),
    removeImage:Joi.boolean().optional()
  }).options({ allowUnknown: true }).required()
  ; 

  export const changePassword = Joi.object().keys({
    currentPassword: generalFields.password.required(),
    newPassword: generalFields.password.required(),
    confirmNewPassword: generalFields.confirmpassword
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({ "any.only": "Passwords do not match" }),
  }).options({allowUnknown:false}).required()