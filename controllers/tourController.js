const Tour = require('../models/tourModel');

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

exports.getAllTours = async (req, res) => {
  try {
    // A way to find filtered results using query params sent from client side and chaining the results
    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // Build the query : find and return all stored tours that matches the query params sent from client side
    const queryObj = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObj[el]);

    // Advance Filtering to include mongodb operators for a single query. Like for duration we can have 4 mongodb operator filters for more refined filtering
    let queryStr = JSON.stringify(queryObj);
    // .replace returns a new string where every occurence of for example 'lt' will be replace with '$lt'
    // 127.0.0.1:3000/api/v1/tours?duration[gt]=5
    queryStr = queryStr.replace(/\b(lt|gt|lte|gte)\b/g, match => `$${match}`);
    let query = Tour.find(JSON.parse(queryStr));

    // Add custom sorting if sent else add default sorting
    // 127.0.0.1:3000/api/v1/tours?sort=difficulty,-price, 127.0.0.1:3000/api/v1/tours?sort=-price
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdBy');
    }

    // When sent from client, add custom fields in response else send default fields back
    // 127.0.0.1:3000/api/v1/tours?fields=price,name,difficulty,duration
    if (req.query.fields) {
      const fieldBy = req.query.fields.split(',').join(' ');
      query = query.select(fieldBy);
    } else {
      query = query.select('-__v1');
    }

    // Add pagination
    // 127.0.0.1:3000/api/v1/tours?page=1&limit=3
    if (req.query.page) {
      const page = req.query.page * 1 || 1;
      const limit = req.query.limit * 1 || 100;
      const skip = (page - 1) * limit;
      // skip, skips given number of pages and limit, limits the number of results to the given value
      query = query.skip(skip).limit(limit);
      const numTours = await Tour.countDocuments();
      // Throwing the error below will shift the control of code to catch block
      if (skip >= numTours) throw new Error('This page does not exist');
    }

    // Execute the query
    const data = await query;
    // Send the response
    res.status(200).json({
      status: 'success',
      results: data.length,
      requestedAt: req.requestTime,
      allTours: {
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
