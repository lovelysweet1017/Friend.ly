// utils/handlers/user.js
var mongoose = require("mongoose");
var User = require("../models/user");
var bcrypt = require("bcrypt-nodejs");
const a = require("array-tools");
const _ = require("lodash/_arrayIncludes");
const guid = require("guid");

mongoose.connect(require("../../config/app").db.connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

function checkSpace(name) {
  var charSplit = name.split("");
  //console.log(charSplit)
  return _(charSplit, " ");
}
/*****
usage:
	var opt = {
		username:'my_name',
		password:'P@sSW0rD',
		fn:'Divy',
		ln:'Srivastava',
		day:23,
		month:'July',
		year:2004
	}
	createNew(opt, (error, result)=> {
		if(!result) return false;
		// Do some post-save stuff here
	})
*****/
function createNew(obj, cb) {
  if (checkSpace(obj.username)) {
    return cb("Username cannot contain spaces.", null);
  } else {
    User.findOne({ $or: [{ username: obj.username, loginType: "friendly" }, { email: obj.email, loginType: "friendly" }] }).exec((err, user) => {
      if (user) {
        return cb("The username/email already exists.", null);
      } else {
        var bio = "Hey there! I'm using Friend.ly";
        var newUser = {
          username: obj.username,
          firstname: obj.firstname,
          lastname: obj.lastname,
          email: obj.email,
          name: obj.firstname + " " + obj.lastname,
          bio: bio,
          profile_picture: "/images/logo/logo.png",
          id: guid.raw(),
          posts: [],
          followers: 0,
          following: 0,
          friendlyFollowers: [],
          notifications: [],
          created_at: Date.now(),
          loginType: "friendly",
          password: obj.password
        };
        return cb(null, newUser);
      }
    });
  }
}

/*****
usage:
	var opt = {
		username:'my_name',
		password:'P@sSW0rD'
	}
	checkUser(opt, (error, result) => {
		if (!result) return false;
		// Do something after log in...
	})
*****/

function checkUser(obj, cb) {
  User.findOne({ username: obj.username, loginType: "friendly" }).exec((err, user) => {
    console.log(user);
    if (err) return cb(err, false);
    if (user) {
      bcrypt.compare(obj.password, user.password, (err, bool) => {
        if (bool) {
          return cb(null, user);
        } else {
          return cb('Bad username or password.', false);
        }
      });
    } else {
      return cb('User not found.', false);
    }
  });
}

/*****
usage:
    var opt = {
        username:'my_name'
    }
    findOne(opt, (error, result) => {
        if (!result) return false;
        // Do something after finding...
    })
*****/

function findOne(obj, cb) {
  User.findOne(obj).exec((err, user) => {
    if (err) return cb(err, false);
    if (user) {
      return cb(err, user);
    } else {
      return cb(null, false);
    }
  });
}

function search(opt, cb) {
  User.find({ username: { $gt: opt } }).exec((err, results) => {
    if (err) return cb(err, false);
    if (results) {
      return cb(err, results);
    } else {
      return cb(null, false);
    }
  });
}

/*****
usage:
   getAll((error, result) => {
        if (!result) return false;
        // Do something after...
    })
*****/

function getAll(cb) {
  User.find({}).exec((err, users) => {
    if (err) return cb(err, false);
    if (users) {
      return cb(null, users);
    } else {
      return cb(null, false);
    }
  });
}

function deleteOne(opt, cb) {
  //if(typeof opt !== Object) cb("Must be a javascript object.");
  User.deleteOne(opt).exec((err, res) => {
    if (err) return cb(err, null);
    else if (res.n == 0) {
      return cb(null, true);
    }
  });
}
function comment(user, comment, _id, cb) {
  User.findOne(user).exec((err, obj) => {
    if (!obj) return cb("Does not exist.", null);
    console.log(obj);
    for (var i = 0; i < obj.posts.length; i++) {
      if (obj.posts[i]._id == _id) {
        obj.posts[i].comments.push(comment);
        obj.notifications.push({
          id: Math.random(),
          msg: `@${comment.by} reacted to your post.`,
          link: `/u/@${obj.username}`,
          time: new Date()
        });
        obj = new User(obj);
        obj.save((err, res) => {
          return cb(err, res);
        });
      }
    }
  });
}
function like(user, like, _id, cb) {
  User.findOne(user).exec((err, obj) => {
    //	if (!obj) return cb("Does not exist.",null);
    //console.log(obj);
    let liked;
    let post = obj.posts.find(x => x._id == _id);
    if (post.likes.find(x => x == like.by)) {
      post.likes.splice(post.likes.indexOf(like.by), 1);
    } else {
      liked = true;
      post.likes.push(like.by);
      obj.notifications.push({
        id: Math.random(),
        msg: `@${like.username} liked your post.`,
        link: `/u/@${obj.username}`,
        time: new Date()
      });
    }
    obj = new User(obj);
    obj.save(err => {
      cb(err, true, post.likes.length, liked);
    });
  });
}

// Expose all the api...
module.exports = {
  createNew: createNew,
  checkUser: checkUser,
  findOne: findOne,
  getAll: getAll,
  comment: comment,
  like: like,
  search: search
};
