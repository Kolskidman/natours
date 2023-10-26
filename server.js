const mongoose = require('mongoose');
const dotenv = require('dotenv');

// process.on('uncaughtException', (err) => {
//   console.log(err.name, err.message);
//   process.exit(1);
// });
dotenv.config({ path: './config.env' });
const app = require('./app');

const DBstr = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

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

const port = 3000;
app.listen(port);

// process.on('unhandledRejection', (err) => {
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });
