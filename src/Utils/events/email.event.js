import EventEmitter from "events";
import { customAlphabet } from "nanoid";
import { GenerateOTP } from "../email/template/verfication.email.js";
import { updateOne } from "../../DB/DB.service.js";
import { hashing } from "../security/hashing/hash.js";
import { userModel } from "../../DB/models/user.model.js";
import { sendemail } from "../email/email.js";

export const emailevent = new EventEmitter();

emailevent.on("ConfirmEmail", async (data) => {
  try {
    const { email } = data;
    const Emailotp = customAlphabet("0123456789", 5)();

    console.log(`📩 Email Sent to ${email}`);

    const html = GenerateOTP({ Otp: Emailotp });
    const hashedOtp = await hashing({ pass: Emailotp });

    await updateOne({
      model: userModel,
      filter: { email },
      data: { confirmEmailOtp: hashedOtp },
    });

    await sendemail({ to: email, html }); // Ensure this function is async
  } catch (error) {
    console.error("❌ Error in ConfirmEmail event:", error);
  }
});
emailevent.on("ForgetPassword", async (data) => {
  const { email } = data;
  const PasswordOtp = customAlphabet("0123456789", 5)();
  console.log(`email Sent to ${email}`);
  const html = GenerateOTP({ Otp: PasswordOtp, text: "forget-password-otp" });
  const hashedotp = await hashing({ pass: PasswordOtp });
  await updateOne({
    model: userModel,
    filter: { email },
    data: { forgetPasswordOtp: hashedotp },
  });
  sendemail({ to: email, subject: "ForgetPassword", html });
});
emailevent.on("PasswordChanged", async (data) => {
  const { email } = data;

  const html = `
      <h3>Password Changed Successfully</h3>
      <p>Hello,</p>
      <p>Your password has been successfully changed. If you did not make this change, please contact our support team immediately.</p>
      <p>Best Regards,</p>
      <p>Learnify Team</p>
    `;

  sendemail({
    to: email,
    subject: "Password Changed Successfully",
    html,
  });

  console.log(`Password change notification sent to: ${email}`);
});

emailevent.on("WelcomeGmailUser", async ({ email, name }) => {
  const html = `
      <div style="font-family: sans-serif;">
        <h2>Welcome to Our Platform, ${name} 🎉</h2>
        <p>We're excited to have you on board.</p>
        <p>Explore courses, track your progress, and reach your goals with us.</p>
        <p>If you ever need help, feel free to reach out.</p>
        <br />
        <p>— Learnify Team</p>
      </div>
    `;

  await sendemail({
    to: email,
    subject: "Welcome to Our Platform!",
    html,
  });

  console.log(`Welcome email sent to ${email}`);
});

emailevent.on("LoginNotification", async ({ email, name, time }) => {
    const formattedTime = new Date(time).toLocaleString("en-US", {
        timeZone: "Africa/Cairo",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
  
    const html = `
      <h2>Hello ${name},</h2>
      <p>We noticed a login to your account:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Time:</strong> ${formattedTime}</li>
      </ul>
      <p>If this wasn't you, please reset your password immediately.</p>
      <p>— Learnify Team</p>
    `;
  
    await sendemail({
      to: email,
      subject: "New Login to Your Account",
      html,
    });
  
    console.log(`Login notification sent to ${email}`);
  });
  
emailevent.on("PaymentSuccess", async ({ email, name, courseTitle }) => {
    const html = `
      <h2>Hi ${name},</h2>
      <p>🎉 Your payment was successful and you've been enrolled in <strong>${courseTitle}</strong>!</p>
      <p>Start learning now and track your progress on the platform.</p>
      <p>— Learnify Team</p>
    `;
  
    await sendemail({
      to: email,
      subject: "Payment Successful & Course Enrolled 🎓",
      html,
    });
  
    console.log(`✅ Payment success email sent to ${email}`);
  });

emailevent.on("TaskReminder", async ({ email, subject, html }) => {
    try {
      await sendemail({
        to: email,
        subject: subject,
        html: html,
      });
      console.log(`Task reminder sent to: ${email}`);
    } catch (error) {
      console.error(`Error sending task reminder to ${email}:`, error);
    }
  });
  