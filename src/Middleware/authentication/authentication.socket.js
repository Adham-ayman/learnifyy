import { userModel } from "../../DB/models/user.model.js";
import { verifyToken } from "../../Utils/token/token.js";

export const authenticationSocket = async ({ socket={} } = {}) => {
  if (!socket.handshake?.auth?.authorization) {
    return {data:{message: "Authentication token is missing." , status:400}}
  }

  const token = socket.handshake.auth.authorization;
  const signatures = [
    process.env.ACCESS_TOKEN_SIG_U,
    process.env.ACCESS_TOKEN_SIG_A,
  ].filter(Boolean); 
  let decoded = null;

  for (const signature of signatures) {
    try {
      
      const result = await verifyToken({ token, signature });      
      if (result?.id) {
        decoded = result;
        break;
      }
    } catch {
    }
  }

  if (!decoded?.id) {
    return {data:{message: "In-valid token payload" , status:401}}
  }

  const user = await userModel.findById(decoded.id)

  if (!user) {
    return {data:{message: "In-valid account" , status:401}}
    }
  return {data:{user, valid:true}};
};

export const authorizationSocket = ({accessRoles = [] , role}={}) => {
  if (!accessRoles.includes(role)) {
    return socket.emit("socketErrorResponse",{message: "not authorized account" , status:401});
  }
  return true;
};
