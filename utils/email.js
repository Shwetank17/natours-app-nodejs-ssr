const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // Create a transporter. We are using Mailtrap for our purpose. Nodemailer supports gmail, yahoo, outlook etc
  const transport = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USERNAME,
      pass: process.env.MAILTRAP_PASSWORD
    }
  });

  // Define the email options
  const mailOptions = {
    from: 'Utkarsh Kukreti <utkarshkukreti@io>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html : This can also be sent to display html content in the resetPassword email
  };

  // Actually send email. sendEmail returns a promise.
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
