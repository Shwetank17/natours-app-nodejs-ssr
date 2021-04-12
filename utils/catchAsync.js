module.exports = fn => {
  return (req, res, next) => {
    // here it would seem like that we are not passing any parameter to 'next' function but in reality whatever the error is catched by catch method is sent automatically to the 'next' function.
    fn(req, res, next).catch(next);
  };
};
