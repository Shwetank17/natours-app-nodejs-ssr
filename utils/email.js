const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Utkarsh Kukreti <${process.env.EMAIL_FROM}>`;
  }

  // Create a transport for production and dev environment.
  createNewTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return 1;
    }
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
  }

  // Send actual email
  async send(template, subject) {
    // Render HTML based on a pug template passed to this method
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    // Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.fromString(html), // converts the html to string which is required to send full text of html to user
      html
    };

    // Create a transport and send the email
    await this.createNewTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours Family!');
  }
};

// Earlier this function was called to send emails (in forgot password) to mailtrap later we created new class 'Email' above and using that for sending real emails
// const sendEmail = async options => {
//   // Create a transporter. We are using Mailtrap for our purpose. Nodemailer supports gmail, yahoo, outlook etc
//   const transport = nodemailer.createTransport({
//     host: process.env.MAILTRAP_HOST,
//     port: process.env.MAILTRAP_PORT,
//     auth: {
//       user: process.env.MAILTRAP_USERNAME,
//       pass: process.env.MAILTRAP_PASSWORD
//     }
//   });

//   // Define the email options
//   const mailOptions = {
//     from: 'Utkarsh Kukreti <utkarshkukreti@io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//     // html : This can also be sent to display html content in the resetPassword email
//   };

//   // Actually send email. sendEmail returns a promise.
//   await transport.sendMail(mailOptions);
// };
