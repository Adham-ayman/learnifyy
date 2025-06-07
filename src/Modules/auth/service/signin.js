import { findOne, updateOne } from "../../../DB/DB.service.js";
import {  userModel } from "../../../DB/models/user.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { emailevent } from "../../../Utils/events/email.event.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";
import { comparehash } from "../../../Utils/security/hashing/hash.js";
import {  generateUserTokens } from "../../../Utils/token/token.js";




export const login = asynchandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await findOne({ model: userModel, filter: { email } });
  if (!user) {
    return next(new Error("Invalid email Please signup", { cause: 404 }));
  }
  const Match = await comparehash({
    pass: password,
    hashedvalue: user.password,
  });
  if (!Match) {
    return next(new Error("Incorrect password", { cause: 404 }));
  }
  if (!user.isActive) {
    user.isActive = true;
    await user.save();
  }

 const { accessToken } = await generateUserTokens(user);

  emailevent.emit("LoginNotification", {
    email: user.email,
    name: user.userName,
    time: Date.now(),
  });

  return sucessResponse({
    res,
    data: {
      message: "Login successful",
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      accessToken,
    },
  });
});

// export const refreshToken = asynchandler(async (req, res, next) => {
//   const refreshToken = req.cookies?.refreshToken;
//   const signatures = [
//     process.env.REFRESH_TOKEN_SIG_U,
//     process.env.REFRESH_TOKEN_SIG_A,
//     process.env.REFRESH_TOKEN_SIG_I
//   ];

//   if (!refreshToken) {
//     return next(new Error("Missing refresh token", { cause: 401 }));
//   }
//   let decoded = null;

//     for (const sig of signatures) {
//       try {
//         decoded = await verifyToken({ token: refreshToken, signature: sig });
//         if (decoded?.id) break;
//       } catch (error) {
//       }
//     }
//     if (!decoded?.id) {
//       return next(new Error("Invalid or expired refresh token", { cause: 401 }));
//     }
   
//     const user = await userModel.findById(decoded.id)
//     if (!user) {
//       return next(new Error("Account not found", { cause: 404 }));
//     }

//     const accessTokenSig =
//     user.role === roletypes.user
//       ? process.env.ACCESS_TOKEN_SIG_U
//       : user.role === roletypes.admin
//       ? process.env.ACCESS_TOKEN_SIG_A
//       : process.env.ACCESS_TOKEN_SIG_I;


//   const newAccessToken = await generateToken({
//     payload: { id: user._id },
//     signature:accessTokenSig,
//     prop: { expiresIn: "30m" },
//   });

//   return sucessResponse({
//     res,
//     data: { accessToken: newAccessToken },
//   });
// });


export const logout = asynchandler(async (req, res) => {
  const user = req.user
  await updateOne({
      model: userModel,
      filter: { _id: user._id, isActive:true
       },
      data: {endSessionTime: Date.now()},
    });

  return sucessResponse({
    res,
    data: { message: "Logged out successfully" },
  });
});
