const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     });
//   }
//   next();
// };

exports.aliasTopTour = (req, resp, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    const updatedQueryObj = new ApiFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute the query. Note that we are awaiting for updatedQueryObj because it a Promise that is returned from async paginate method.
    const tours = await (await updatedQueryObj).query;

    // Send the response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      requestedAt: req.requestTime,
      allTours: {
        tours
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      requestedAt: req.requestTime,
      error: error
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    // find and return specific tour in tours collection in natour-primary db
    const data = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      requestedTour: {
        data
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      requestedAt: req.requestTime,
      error: error
    });
  }
};

exports.createTour = async (req, res) => {
  // We could have also done as below
  // const newTour = new Tour(req.body)
  // newTour.save() -> this would have returned a promise in which we could have used 'then' and 'catch' but we are preferring async await

  // Since we are using async await so we are using try catch block. Tour.create() will also return a promise
  try {
    const newTour = await Tour.create(req.body);
    console.log('Tour created successfully');
    res.status(201).json({
      status: 'success',
      tourCreated: {
        newTour
      }
    });
  } catch (error) {
    console.log('Error creating Tour document');
    // 400 status code for bad request
    res.status(400).json({
      status: 'error',
      error: error
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // req.body passed to findByIdAndUpdate will contain the JSON data to be updated for the given id. 'new' true means return a new updated document, runValidators true means that whatever validations we have specified in our Tour model should run on the updated document as well.
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      updatedTour: {
        updatedTour
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      error: error
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: 'success',
      deletedTour: {
        deletedTour
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      error: error
    });
  }
};
