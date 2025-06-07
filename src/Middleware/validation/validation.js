import Joi from "joi"
import { gendertypes, providertypes, roletypes } from "../../DB/models/user.model.js"
import { leveltypes } from "../../DB/models/course.model.js"


export const generalFields = {
    userName:Joi.string().pattern(new RegExp(/^[a-zA-Z\u0621-\u064Aء-ئ][^#&<>\"~;$^%{}?]{1,20}$/)),
    email:Joi.string().pattern(new RegExp(/^[a-zA-Z]{1,}\d{0,}[a-zA-Z0-9]{1,}[@][a-z]{1,}(\.com|\.edu|\.net){1,3}$/)),
    password:Joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)),
    confirmpassword:Joi.string(),
    phone:Joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)).messages({"string.pattern.base": "Phone must be a valid Egyptian number"}),
    DOB:Joi.date().less('now'),
    Id:Joi.string().hex().length(24),
    Otp:Joi.string().pattern(new RegExp(/^\d{5}$/)),
    provider:Joi.string().valid(...Object.values(providertypes)),
    role:Joi.string().valid(...Object.values(roletypes)),
    gender:Joi.string().valid(...Object.values(gendertypes)),
}
export const courseFields ={
  title: Joi.string().min(3).max(100),
  description: Joi.string().min(10),
  price: Joi.number().positive(),
  totalHours: Joi.number().positive(),
  category: Joi.string().min(3).max(50),
  level: Joi.string()
    .valid(...Object.values(leveltypes))
    .default(leveltypes.medium),
}
export const validation =(schema)=>{
     return (req,res,next)=>{
        const inputdata ={...req.body,...req.params,...req.query}
        if (req.file || req.files?.length) {
            inputdata.file={...req.file,...req.files}
        }
        const validationResult  =  schema.validate(inputdata,{abortEarly:false})
        if (validationResult.error) {
            return res.status(400).json({message:validationResult.error.details})
        }
       return next()
    }
}