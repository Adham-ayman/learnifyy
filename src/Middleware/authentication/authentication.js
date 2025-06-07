import { userModel } from "../../DB/models/user.model.js";
import { asynchandler } from "../../Utils/errors/errorhandeler.js";
import { verifyToken } from "../../Utils/token/token.js";




export const authentication =()=>{
   return asynchandler(async (req, res, next) => {
    const accessToken = req.headers?.authorization; 

    if (!accessToken) {
      return next(new Error("Authentication error: Token missing", { cause: 401 }));
    }

    const signatures = [
      process.env.ACCESS_TOKEN_SIG_U,
      process.env.ACCESS_TOKEN_SIG_I,
      process.env.ACCESS_TOKEN_SIG_A
    ];
    
    let decoded = null;

    for (const sig of signatures) {
      try {
        decoded = await verifyToken({ token: accessToken, signature: sig });
        if (decoded?.id) break;
      } catch (error) {
      }
    }
    if (!decoded?.id) {
      return next(new Error("Invalid or expired token", { cause: 401 }));
    }
 
    const user = await userModel.findById(decoded.id)
    
    if (!user) {
      return next(new Error("Invalid account: User not found", { cause: 404 }));
    }
    const endSessionTime = parseInt((user.endSessionTime?.getTime()/1000 || 0))  
    const tokenTime =  decoded.iat       
    if(endSessionTime>=tokenTime){
        return next(new Error('expired Token pls login again'))
    }

    req.user = user
    return next()
  }) 
}


export const authorization =(accessRoles=[])=>{
   return asynchandler((req,res,next)=>{
        if (!req.user || !accessRoles.includes(req.user.role)) {
            return next(new Error("Forbidden: You are not authorized to access this resource", { cause: 403 }))
        }
            return next()
        
    })
}