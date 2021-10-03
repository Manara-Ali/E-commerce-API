////////////////////////////////////// IMPORT MODULES //////////////////////////////////////

// Import nodemailer to be able to send new emails to users
const nodemailer = require("nodemailer");

//////////////////////////// CREATE THE FUNCTION TO SEND EMAILS /////////////////////////////////

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Create email options
  const mailOptions = {
    from: "<Manara Ali manaraali22@gmail.com>",
    to: options.email,
    subject: `Forgot Your Password?`,
    text: options.message,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

////////////////////////////// EXPORT MODULE //////////////////////////////////
module.exports = sendEmail;
