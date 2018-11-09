const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongo = require("mongodb");
const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


/*/ Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'});
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; //bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || 'Internal Server Error';
  }
  res.status(errCode).type('txt')
    .send(errMessage);
});*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

const Schema = mongoose.Schema;
const userSchema = new Schema({username: {type: String, required: true}});
let User = mongoose.model("User", userSchema);

const taskSchema = new Schema({userId: String, description: String, duration: Number, date: Date});
let Task = mongoose.model("Task", taskSchema);



//Post new user data with username and _id
app.post("/api/exercise/new-user", function(req, res, done) {
  let newUser = new User({username: req.body.username});
  newUser.save(function(err) {
    if (err) res.json({error: "error saving new user"});
    else res.json({username: req.body.username});
  });
});

//Get all users
app.get("/api/exercise/users", function(req, res, done) {
  User.find({}, function(err, data) {
    res.json({data: data});
  });
});

//Post new exercise data with userID(_id), description, duration, and optional date (default to today's date with no data given)
app.post("/api/exercise/add", function(req, res, done) {
  let newDate = new Date(req.body.date);
  if (newDate == "") newDate = new Date();
  let newTask = new Task({userId: req.body.userId, description: req.body.description, duration: req.body.duration, date: newDate});
  newTask.save(function(err) {
    if (err) res.json({error: "error saving new exercise"});
    else res.json({userId: req.body.userId, description: req.body.description, duration: req.body.duration, date: newDate});
  });
});

//Get all exercises of any user with parameter of userID(_id)
//If provided data range, only grabs logs inside those days, or up to a limit
app.get("/api/exercise/log", function(req, res, done) {
  if (req.query.userId == "") {
   res.json({error: "please supply userId"}); 
  }
  else {
   let taskList;
   let limit = req.query.limit;
   if (limit === "") limit = 9999999;
   Task.find({userId: req.query.userId}, function(err, data) {
     if (req.query.from != "" && req.query.to == "") {
       taskList = data.filter((item) => item.date >= req.query.from && item.duration <= limit);
       res.json({data: taskList});
     }
     else if (req.query.from == "" && req.query.to != "") {
       taskList = data.filter((item) => item.date <= req.query.to && item.duration <= limit);
       res.json({data: taskList});
     }
     else if (req.query.from != "" && req.query.to != "") {
      taskList = data.filter((item) => item.date >= req.query.from && item.date <= req.query.to && item.duration <= limit); 
     }
     else {
      res.json({data: data}); 
     }
   }); 
  }
});


