const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(
          `No document found with provided id - ${req.params.id}`,
          404
        )
      );
    }

    // Send the response
    res.status(200).json({
      status: 'Document deleted successfully!',
      deletedDocuments: doc.length,
      requestedAt: req.requestTime
    });
  });
};

exports.updateOne = Model => {
  return catchAsync(async (req, res, next) => {
    // req.body passed to findByIdAndUpdate will contain the JSON data to be updated for the given id. 'new' true means return a new updated document, runValidators true means that whatever validations we have specified in our Model should run on the updated document as well.
    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedDoc) {
      return next(
        new AppError(
          `No Document found with provided id - ${req.params.id}`,
          404
        )
      );
    }

    // Send the response
    res.status(200).json({
      status: 'success',
      results: updatedDoc.length,
      requestedAt: req.requestTime,
      data: {
        updatedDoc
      }
    });
  });
};

exports.createOne = Model => {
  return catchAsync(async (req, res, next) => {
    // We could have also done as below
    // const newDoc = new Model(req.body)
    // newDoc.save() -> this would have returned a promise in which we could have used 'then' and 'catch' but we are preferring async await

    // Since we are using async await so we are using catchAsync block to catch errors. Model.create() will also return a promise on which we await. We are not sanitizing req.body because our Model is strong enough to discard any unwanted values
    const newDoc = await Model.create(req.body);
    if (!newDoc) {
      // didn't know the error code for this case so setting 400 as of now
      throw new AppError('Error creating document in db!', 500);
    }

    // Send the response
    res.status(201).json({
      status: 'success',
      results: newDoc.length,
      requestedAt: req.requestTime,
      data: {
        newDoc
      }
    });
  });
};

exports.getOne = (Model, populateObj) => {
  return catchAsync(async (req, res, next) => {
    // there is a case when we want to populate reviews in getting a single tour. For that we pass populateObj. So handling that condition here. Although it's not recommended to handle it here as this logic is supposed to reside in the controller that is calling 'getOne' method.
    let query = Model.findById(req.params.id);
    query = query.populate(populateObj);
    // find and return specific document by id in Model's collection in natour-primary db
    const doc = await query;
    if (!doc) {
      return next(
        new AppError(
          `No document found with provided id - ${req.params.id}`,
          404
        )
      );
    }

    // Send the response
    res.status(200).json({
      status: 'success',
      results: doc.length,
      requestedAt: req.requestTime,
      data: {
        doc
      }
    });
  });
};

exports.getAll = Model => {
  return catchAsync(async (req, res, next) => {
    // these methods are now in handleFactory will work for any controller calling this function. Earlier it was limited to getting all the tours as it was residing in tourController
    const updatedQueryObj = new ApiFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute the query. Note that we are awaiting for updatedQueryObj because it is a Promise that is returned when paginate method is called above(because paginate is a async function). Also we are having another await right after docs = ...It's because we have to execute the final query to get the desired documents.
    const docs = await (await updatedQueryObj).query;

    // Send the response
    res.status(200).json({
      status: 'success',
      results: docs.length,
      requestedAt: req.requestTime,
      data: {
        docs
      }
    });
  });
};
