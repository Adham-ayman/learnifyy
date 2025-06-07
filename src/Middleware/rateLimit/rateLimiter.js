import rateLimit from 'express-rate-limit';


export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 5,
  message: "Too many OTP requests. Please try again later.",
  standardHeaders: false,
  legacyHeaders: false,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 3, 
  message: "Too many password reset attempts. Please try again later.",
  standardHeaders: false,
  legacyHeaders: false,
});


export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15min
    max: 5,
    message: { message: "Too many login attempts. Please try again later." },
    standardHeaders: false,
    legacyHeaders: false, 
  });

  export const profileUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5,
    message: "Too many profile updates from this IP, please try again later",
  });
  
  export const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many password changes from this IP, please try again later",
  });
  