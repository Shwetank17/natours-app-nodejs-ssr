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
      // Using gmail for production environment to send emails to clients
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASSWORD
        }
      });
    }
    // in development mode we are using mailtrap to send and test emails
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

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset request (Valid for 10 mins only!)'
    );
  }
};
