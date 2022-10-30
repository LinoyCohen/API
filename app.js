const express = require('express');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const User = require('./models/userModel');
const { promisify } = require('util');

const userRouter = require('./routes/userRoutes');
const { resetPassword } = require('./controllers/userController');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => console.log('DB connection successful!'));

app.get('/', (req, res) => {
  // const decoded = await promisify(jwt.verify)(
  //   req.query.token,
  //   process.env.JWT_SECRET
  // );

  res.sendFile(__dirname + '/public/resetPassword.html');
  // const user = await User.findByIdAndUpdate(
  //   { email: decoded.email },
  //   { password: req.body.pass }
  // );
});

app.post('/', async (req, res) => {
  const password = req.body.pass;

  let token = req.rawHeaders[33].split('=')[1];
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findOneAndUpdate(
    { email: decoded.email },
    { password: await bcrypt.hash(password, 12) }
  );
});

// ROUTES
app.use('/api/users', userRouter);

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
