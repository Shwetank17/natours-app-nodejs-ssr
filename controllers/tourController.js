const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

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

exports.getAllTours = factory.getAll(Tour);

// {path: 'reviews'} is an example of virtual populate strategy
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);
// Below block is commented to remember how we introduced factory
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const deletedTour = await Tour.findByIdAndDelete(req.params.id);
//   if (!deletedTour) {
//     return next(
//       new AppError(`No tour found with provided id - ${req.params.id}`, 404)
//     );
//   }
//   res.status(200).json({
//     status: 'Tour deleted successfully!'
//   });
// });

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
    // $unwind : Each tour document has 'startDates' array with multiple dates. Say there are 9 documents and each having 3 dates in their respective 'startDates' field. unwind will take up those dates say for a given tour it will create 3 documents with same values except each of the document will have the startDate field having one of the value(from 3 values originally present in it)
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

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [latitude, longitude] = latlng.split(',');

  // the divisor is the radius of the earth in miles and kilometers respectively.
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!latitude || !longitude) {
    return next(
      new AppError(
        'Latitudes and Longitudes are required in correct format in order to show the results!'
      )
    );
  }

  const tours = Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] }
    }
  });

  // Send the response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    requestedAt: req.requestTime,
    data: {
      tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [latitude, longitude] = latlng.split(',');

  // if unit is not sent in 'mi' then we will convert the distance to kilometers by default
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!latitude || !longitude) {
    return next(
      new AppError(
        'Latitudes and Longitudes are required in correct format in order to show the results!'
      )
    );
  }

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude * 1, latitude * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  // Send the response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    requestedAt: req.requestTime,
    data: {
      tours
    }
  });
});
