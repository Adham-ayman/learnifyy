import { create, findAll, findOne , updateOne } from "../../../DB/DB.service.js";
import { providertypes, roletypes, userModel } from "../../../DB/models/user.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { emailevent } from "../../../Utils/events/email.event.js";
import { verifyGoogleToken } from "../../../Utils/helper/google.helper.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";
import { encryption } from "../../../Utils/security/encryption/encrypt.js";
import { comparehash,hashing } from "../../../Utils/security/hashing/hash.js";
import {generateUserTokens } from "../../../Utils/token/token.js";


export const signup = asynchandler(async (req, res, next) => {
    const { firstName, lastName, email, password, phone, DOB, gender } = req.body;
    const checkUser = await findOne({ model: userModel, filter: { email } });
    if (checkUser) {
      return next(new Error("user already exist pls signin", { cause: 404 }));
    }
    const hashedpassword = await hashing({ pass: password });
    const encrptphone = await encryption({ plaintext: phone });
    const newUser  = await create({
      model: userModel,
      data: {
        firstName,
        lastName,
        email,
        password: hashedpassword,
        phone: encrptphone,
        DOB,
        gender,
      },
    });
    emailevent.emit("ConfirmEmail", { email });
    return sucessResponse({ res, data:{userId:newUser._id ,message: `OTP sent successfully to ${email}`}

     });
  });

  export const confirmEmail = asynchandler(async (req, res, next) => {
    const { confirmEmailOtp, email } = req.body;
    const checkUser = await findOne({ model: userModel, filter: { email } });
    if (!checkUser) {
      return next(new Error("User doesn't exist. Please sign up", { cause: 404 }));
    }
    if (checkUser?.confirmEmail) {
      return next(new Error("Email already confirmed. Please login.", { cause: 409 }));
    }
    if (!checkUser?.confirmEmailOtp) {
      return next(
        new Error("OTP not found. Please sign up again to get a confirmation OTP or click resend Otp", { cause: 400 })
      );
    }
    const isOtpValid  = await comparehash({
      pass: confirmEmailOtp,
      hashedvalue: checkUser.confirmEmailOtp,
    });
    if (!isOtpValid) {
      return next(new Error("incorrect otp", { cause: 401 }));
    }
    await updateOne({
      model: userModel,
      filter: { email },
      data: { $set: { confirmEmail: true }, $unset: { confirmEmailOtp: "" } },
    });
    return sucessResponse({
      res,
      data: { message: "Email verified successfully" },
    });
  });

  // export const resendOtp = asynchandler(async (req, res, next) => {
  //   const { email } = req.body;
  //   const checkUser = await findOne({ model: userModel, filter: { email } });
  //   if (!checkUser) {
  //     return next(new Error("User not found. Please sign up first", { cause: 404 }));
  //   }
  //   // if (checkUser.confirmEmail) {
  //   //     return next(new Error("Email already confirmed. Please login.", { cause: 409 }));
  //   //   }
  //   emailevent.emit("ConfirmEmail", { email });
  //   return sucessResponse({
  //     res,
  //     data: { message: `OTP resent successfully to ${email}` },
  //   });
  // });

  export const resendOtp = asynchandler(async (req, res, next) => {
  const { email, type } = req.body;

  if (!['ConfirmEmail', 'ForgetPassword'].includes(type)) {
    return next(new Error("Type must be 'ConfirmEmail' or 'ForgetPassword'", { cause: 400 }));
  }

  const checkUser = await findOne({ model: userModel, filter: { email } });
  if (!checkUser) {
    return next(new Error("User not found. Please sign up first", { cause: 404 }));
  }

  if (type === 'ConfirmEmail' && checkUser.confirmEmail) {
    return next(new Error("Email already confirmed. Please login.", { cause: 409 }));
  }

  const eventName = type === 'ConfirmEmail' ? 'ConfirmEmail' : 'ForgetPassword';
  emailevent.emit(eventName, { email });

  return sucessResponse({
    res,
    data: { message: `OTP resent successfully to ${email} for ${type}` },
    status: 200,
  });
});
  export const forgetPassword = asynchandler(async (req, res, next) => {
    const { email } = req.body;
    const checkUser = await findOne({ model: userModel, filter: { email } });
    if (!checkUser) {
      return next(new Error("User not found. Please sign up first", { cause: 404 }));
    }
    emailevent.emit("ForgetPassword", { email });
    return sucessResponse({
      res,
      data: { message: `Password reset OTP sent to ${email}` },
    });
  });

  export const resetPassword = asynchandler(async (req, res, next) => {
    const { forgetPasswordOtp, email, newpassword } = req.body;
    const checkUser = await findOne({ model: userModel, filter: { email } });
    if (!checkUser) {
      return next(new Error("User does not exist. Please sign up", { cause: 404 }));
    }
    if (!checkUser?.forgetPasswordOtp) {
      return next(
        new Error("OTP expired or not requested. Please request a new one.", { cause: 400 })
      );
    }
    const match = await comparehash({
      pass: forgetPasswordOtp,
      hashedvalue: checkUser.forgetPasswordOtp,
    });
    if (!match) {
      return next(new Error("incorrect otp", { cause: 400 }));
    }
    const isOldPasswordSame = await comparehash({
        pass: newpassword,
        hashedvalue: checkUser.password,
      });
    
      if (isOldPasswordSame) {
        return next(new Error("You cannot reuse your old password. Please choose a new one.", { cause: 400 }));
      }
    const hashedpassword = await hashing({ pass: newpassword });
    await updateOne({
      model: userModel,
      filter: { email },
      data: {
        $set: {
          password: hashedpassword,
          confirmEmail: true
        },
        $unset: { forgetPasswordOtp: "" },
      },
    });
    res.clearCookie("refreshToken");
    emailevent.emit("PasswordChanged", { email });
    return sucessResponse({
      res,
      data: { message: "Password updated successfully , pls login again" },
    });
  });

  export const signupWithGmail = asynchandler(async (req, res, next) => {
    const { idToken } = req.body;
    if (!idToken) return next(new Error("Missing ID token", { cause: 400 }));
  
    const { email, email_verified, name, picture } = await verifyGoogleToken(idToken);
    if (!email_verified) return next(new Error("Email not verified", { cause: 401 }));
  
    let user = await findOne({ model: userModel, filter: { email } });
    const isNewUser = !user;
  
    if (isNewUser) {
      user = await create({
        model: userModel,
        data: {
          userName: name,
          email,
          confirmEmail: true,
          imageURL: picture,
          provider: providertypes.google,
        },
      });
    }
  
    if (user.provider === providertypes.system) {
      return next(new Error("Please login using email and password", { cause: 403 }));
    }

    if (!user.isActive) {
        user.isActive = true;
        await user.save();
      }
  
    const { accessToken } = await generateUserTokens(user);
  
    if (isNewUser) {
      emailevent.emit("WelcomeGmailUser", { email, name });
    }
  
    return sucessResponse({
      res,
      data: {
        message: isNewUser ? "User registered successfully" : "Login successful",
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
  
 