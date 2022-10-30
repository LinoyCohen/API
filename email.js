const nodemailer = require('nodemailer');
const fs = require('fs');
const { promisify } = require('util');
const User = require('./models/userModel');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // const readFile = promisify(fs.readFile);
  // const url = await readFile('resetPassword.html', 'utf8');
  const url = 'http://localhost:3000';

  const mailOptions = {
    from: 'Linoy Cohen <SYSTEM MAIL',
    to: options.email,
    subject: options.subject,
    html: `<p>Click <a href=${url}/?token=${options.token}>Here</a> to reset your password</p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

/// WHERE I STOPED? complete the reset password part.
