// import nodemailer from "nodemailer";

// export const sendemail=
//   async ({to="",cc="",bcc="",subject="Confirm-email✔",text="",html="",attachments=[]}={})=> {
//     const transporter = nodemailer.createTransport({
//         service:'gmail',
//        auth: {
//          user: process.env.FROM_EMAIL,
//          pass: process.env.EMAIL_PASS,
//        },
//        tls: {
//         rejectUnauthorized: false,  // ✅ Fix for self-signed certificate error
//     },
//      });
//   const info = await transporter.sendMail({
//     from: `Learnify <${process.env.FROM_EMAIL}>`, 
//     to,
//     cc,
//     bcc,
//     subject,
//     text,
//     html,
//     attachments
//   });

//   return info
// }
import nodemailer from "nodemailer";

export const sendemail = async ({
  to = "",
  cc = "",
  bcc = "",
  subject = "Confirm-email✔",
  text = "",
  html = "",
  attachments = [],
} = {}) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Explicitly specify Gmail's SMTP host
    port: 587, // Use 587 for TLS or 465 for SSL
    secure: false, // Set to true for port 465, false for 587
    auth: {
      user: process.env.FROM_EMAIL,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Only if you encounter certificate issues
    },
    connectionTimeout: 10000, // 10 seconds timeout
    greetingTimeout: 10000, // 10 seconds timeout
    socketTimeout: 10000, // 10 seconds timeout
  });

  const info = await transporter.sendMail({
    from: `Learnify <${process.env.FROM_EMAIL}>`,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    attachments,
  });

  return info;
};