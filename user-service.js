const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
require('dotenv').config();

let Schema = mongoose.Schema;

let userSchema = new Schema({
    userName: {
      type: String,
      unique: true
    },
    password: String,
    favourites: [{
      title: String,
      artist: String,
      imagePath: String
    }],
    history: [{
      title: String,
      artist: String,
      imagePath: String
    }]
  });

let User;

module.exports.connect = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGO_URL, {useNewUrlParser: true});

        db.on('error', (err) => {
            reject(err);
        });

        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser =  function (userData) {
    return new Promise(function (resolve, reject) {

        if (userData.password != userData.password2) {
            reject("Passwords do not match");
        } else if ( userData.userName == "" || userData.password == "" || userData.password2 == "") {
            reject("Fields are blank.");
        } else {
            bcrypt.hash(userData.password, 10).then(hash=>{
                
                userData.password = hash;
                userData.favourites = [];
                userData.history = [];

                let newUser = new User(userData);

                newUser.save().then(() => {
                    resolve("User " + userData.userName + " successfully registered");
                }).catch(err => {
                    if (err.code == 11000) {
                        reject("User Name already taken");
                    } else {
                        reject("There was an error creating the user: " + err);
                    }
                });
            }).catch(err=>reject(err));
        }
    });      
};

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {

        User.find({ userName: userData.userName })
        .limit(1)
        .exec()
        .then((users) => {

            if (users.length == 0) {
                reject("Unable to find user " + userData.userName);
            } else {
                bcrypt.compare(userData.password, users[0].password).then((res) => {
                    if (res === true) {
                        resolve(users[0]);
                    } else {
                        reject("Incorrect password for user " + userData.userName);
                    }
                });
            }
        }).catch((err) => {
            reject("Unable to find user " + userData.userName);
        });
    });
};

module.exports.findFavourites = function(userData) {
    return User.findOne({ userName: userData.userName }, { favourites: 1 })
        .exec()
        .then(users => {
            if (!users) {
                throw new Error("User not found");
            }
            return users.favourites;
        });
};

module.exports.findHistory = function(userData) {
    return User.findOne({ userName: userData.userName }, { history: 1 })
        .exec()
        .then(users => {
            if (!users) {
                throw new Error("User not found");
            }
            return users.history;
        });
};

module.exports.addFavourite = function(userData) {
    return User.findOneAndUpdate({ userName: userData.userName }, { $addToSet: { favourites: userData.favourites } }, { new: true })
        .exec()
        .then(users => {
            if (!users) {
                throw new Error("User not found");
            }
            return users.favourites;
        });
};

module.exports.addHistory = function(userData) {
    console.log(userData.history);
    return User.findOneAndUpdate(
        { userName: userData.userName }, 
        { $push: { history: { $each: [userData.history], $position: 0 } } }, 
        { new: true }
    )
    .exec()
    .then(users => {
        if (!users) {
            throw new Error("User not found");
        }
        return users.history;
    });
};

module.exports.deleteFavourites = function(userData) {
    return User.findOneAndUpdate({ userName: userData.userName }, { $pull: { favourites: { _id: userData.favouriteId } } }, { new: true })
        .exec()
        .then(users => {
            if (!users) {
                throw new Error("User not found");
            }
            return users.favourites;
        });
};

module.exports.deleteAllFavourites = function(userData) {
    return User.findOneAndUpdate(
        { userName: userData.userName }, 
        { $set: { favourites: [] } },
        { new: true }
    )
    .exec()
    .then(user => {
        if (!user) {
            throw new Error("User not found");
        }
        return user.history;
    });
};

module.exports.deleteHistory = function(userData) {
    return User.findOneAndUpdate({ userName: userData.userName }, { $pull: { history: { _id: userData.historyId } } }, { new: true })
        .exec()
        .then(users => {
            if (!users) {
                throw new Error("User not found");
            }
            return users.history;
        });
};

module.exports.deleteAllHistory = function(userData) {
    return User.findOneAndUpdate(
        { userName: userData.userName }, 
        { $set: { history: [] } },
        { new: true }
    )
    .exec()
    .then(user => {
        if (!user) {
            throw new Error("User not found");
        }
        return user.history;
    });
};
