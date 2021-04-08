const jwt = require('jsonwebtoken');

module.exports = payload => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { id: payload },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      },
      function(error, token) {
        if (error) {
          reject(error);
        } else {
          resolve(token);
        }
      }
    );
  });
};
