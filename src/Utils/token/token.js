import jwt from 'jsonwebtoken'
import { roletypes } from '../../DB/models/user.model.js'

export const generateToken = async({payload={} , signature=process.env.ACCESS_TOKEN_SIG_U,prop={}}={})=>{
    const generate = jwt.sign(payload,signature,prop)    
    return generate
}

export const verifyToken = async({token="" , signature =process.env.ACCESS_TOKEN_SIG_U}={})=>{
    const verfiy = jwt.verify(token,signature)  
    return verfiy
}

export const generateUserTokens = async (user) => {
    let accessSig;
  
    switch (user.role) {
      case roletypes.user:
        accessSig = process.env.ACCESS_TOKEN_SIG_U;
        break;
      case roletypes.admin:
        accessSig = process.env.ACCESS_TOKEN_SIG_A;
        break;
      case roletypes.instructor:
        accessSig = process.env.ACCESS_TOKEN_SIG_I;
        break;
      default:
        throw new Error("Invalid user role");
    }
  
    const accessToken = await generateToken({
      payload: { id: user._id },
      signature: accessSig,
      prop: { expiresIn: "12h" },
    });
    return { accessToken };
  };
  