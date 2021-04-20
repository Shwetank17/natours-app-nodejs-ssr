const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');

dotenv.config({ path: `${__dirname}/../../config.env` });

const DB = process.env.DATABASE_REMOTE_VIA_APPLICATION_CONNECTION_STRING.replace(
  '<PASSWORD>',
  process.env.DATABASE_REMOTE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('Database connection successful!'));

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    // We can pass an array of tour objects to 'create' method on Tour model. This method will create separate documents for each element in the 'tours' array and then will save the data in database
    await Tour.create(tours);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// process.argv is an array that contains the list of command line arguments passed to node process when we run a file using node. for example node ./dev-data/data/import-dev-data.js will have 2 arguments passed automatically by node process. One of the argument passed is the path to the node binary file and other is the path to the file that node is asked to run i.e import-dev-data.js. So from command line we will pass '--import' or '--delete' while running this import-dev-data.js file via node and use these command line arguments to decide whether to delete or import data.
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
