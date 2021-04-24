const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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

exports.getAllTours = catchAsync(async (req, res, next) => {
  const updatedQueryObj = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute the query. Note that we are awaiting for updatedQueryObj because it a Promise that is returned from async paginate method. Also we are having another await right after tours = ...It's because we have to executed the final query.
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
});

exports.getTour = catchAsync(async (req, res, next) => {
  // find and return specific tour in tours collection in natour-primary db
  const data = await Tour.findById(req.params.id).populate('reviews');
  if (!data) {
    return next(
      new AppError(`No tour found with provided id - ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    requestedTour: {
      data
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // We could have also done as below
  // const newTour = new Tour(req.body)
  // newTour.save() -> this would have returned a promise in which we could have used 'then' and 'catch' but we are preferring async await

  // Since we are using async await so we are using try catch block. Tour.create() will also return a promise
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    tourCreated: {
      newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // req.body passed to findByIdAndUpdate will contain the JSON data to be updated for the given id. 'new' true means return a new updated document, runValidators true means that whatever validations we have specified in our Tour model should run on the updated document as well.
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!updatedTour) {
    return next(
      new AppError(`No tour found with provided id - ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: 'success',
    updatedTour: {
      updatedTour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const deletedTour = await Tour.findByIdAndDelete(req.params.id);
  if (!deletedTour) {
    return next(
      new AppError(`No tour found with provided id - ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: 'success',
    deletedTour: {
      deletedTour
    }
  });
});

// First example of mongodb aggregation pipeline. This pipeline is created to pass our documents through this pipeline and then show the result as per our pipeline implementation. Tour.aggregate() returns an aggregate object unlike Tour.find() which returns a query object. Each object inside the aggregate array represent a stage of aggregation. These stages are executed in order they are specified.
exports.getTourStat = catchAsync(async (req, res, next) => {
  const stat = await Tour.aggregate([
    // $match filters the result basis the match condition specified. Grouping criteria specified in 2nd stage will happen on the results returned from the match documents.
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    // $group groups the output data basis the field defined in '_id' field. If '_id' is set to null then no data grouping will be seen in the response and all data specified will be shown.
    {
      $group: {
        // _id: null,
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    // sort price in ascending order
    { $sort: { avgPrice: 1 } },
    { $match: { _id: { $ne: 'EASY' } } }
  ]);

  res.status(200).json({
    status: 'success',
    records: stat.length,
    stat: {
      stat
    }
  });
});

// Solving a real world business problem using unwind, project and more
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-30`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    { $addFields: { month: '$_id' } },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numToursStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    records: plan.length,
    plan: {
      plan
    }
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  // here we are not sanitizing req.body because our 'Tour' model is strong enough to discard any unwanted values
  const review = await Review.create(req.body);
  if (!review) {
    // didn't know the error code for this case so setting 500
    throw new AppError('Error creating review in db!', 500);
  }
  res.status(201).json({
    status: 'success',
    createdReview: review
  });
});
