const Tour = require('../models/tourModel');

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // FILTERING
  filter() {
    // A way to find filtered results using query params sent from client side and chaining the results
    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // Build the query : find and return all stored tours that matches the query params sent from client side
    if (this.queryString) {
      const queryObj = { ...this.queryString };
      // Excluding below fields because these are not valid schema fields or mongodb operator
      const excludeFields = ['page', 'sort', 'limit', 'fields'];
      excludeFields.forEach(el => delete queryObj[el]);

      // Advance Filtering to include mongodb operators for a single query. Like for duration we can have 4 mongodb operator filters for more refined filtering
      let queryStr = JSON.stringify(queryObj);
      // .replace returns a new string where every occurence of for example 'lt' will be replace with '$lt'
      // 127.0.0.1:3000/api/v1/tours?duration[gt]=5 -> this comes in req.query as { duration : {gt: 5}} which we need to modify to { duration : {$gt: 5}}
      queryStr = queryStr.replace(/\b(lt|gt|lte|gte)\b/g, match => `$${match}`);
      this.query = this.query.find(JSON.parse(queryStr));
    }
    return this;
  }

  // SORTING
  sort() {
    // Add custom sorting if sent else add default sorting
    // 127.0.0.1:3000/api/v1/tours?sort=difficulty,-price, 127.0.0.1:3000/api/v1/tours?sort=-price
    if (this.queryString && this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdBy');
    }
    return this;
  }

  // LIMIT FIELDS
  limitFields() {
    // When sent from client, add custom fields in response else send default fields back
    // 127.0.0.1:3000/api/v1/tours?fields=price,name,difficulty,duration
    if (this.queryString && this.queryString.fields) {
      const fieldBy = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldBy);
    } else {
      this.query = this.query.select('-__v1');
    }
    return this;
  }

  // PAGINATION
  async paginate() {
    // 127.0.0.1:3000/api/v1/tours?page=1&limit=3
    if (this.queryString && this.queryString.page) {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
      // skip, skips given number of pages and limit, limits the number of results to the given value
      this.query = this.query.skip(skip).limit(limit);
      const numTours = await Tour.countDocuments();
      // Throwing the error below will shift the control of code to catch block
      if (skip >= numTours) throw new Error('This page does not exist');
    }
    return this;
  }
}

module.exports = ApiFeatures;
