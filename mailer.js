const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.sendConfirmationEmail = async (to, link) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: 'Confirm your email',
    html: `<a href="${link}">Click to confirm</a>`
  });
};