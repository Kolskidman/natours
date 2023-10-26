const mongoose = require('mongoose');

const fs = require('fs');

// const dotenv = require('dotenv');

const Tour = require('../../models/tourModel');

// dotenv.config({ path: './../../config.env' });

// const DBstr = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD,
// );

const DBstr =
  'mongodb+srv://admin:YbbHzAS1hV6qV3VP@cluster0.8cfceon.mongodb.net/natours?retryWrites=true&w=majority';

mongoose
  .connect(DBstr, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful');
  });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
);

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully inserted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// eslint-disable-next-line no-unused-expressions
process.argv[2] === '--import' ? importData() : deleteData();
