const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
    res.status(200).json({
      status: 'Document deleted successfully!'
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
    res.status(200).json({
      status: 'success',
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

    // Since we are using async await so we are using catchAsync block to catch errors. Model.create() will also return a promise on which we await. We are not sanitizing req.body because our 'Tour' model is strong enough to discard any unwanted values
    const newDoc = await Model.create(req.body);
    if (!newDoc) {
      // didn't know the error code for this case so setting 400 as of now
      throw new AppError('Error creating document in db!', 500);
    }
    res.status(201).json({
      status: 'success',
      data: {
        newDoc
      }
    });
  });
};
