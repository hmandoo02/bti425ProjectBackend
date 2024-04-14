const express = require("express");
const cors = require("cors");
require('dotenv').config();
const lastfmService = require("./lastfm-service.js");
const userService = require("./user-service.js");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: process.env.JWT_SECRET,
};

let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        next(null, { _id: jwt_payload._id, 
            userName: jwt_payload.userName }); 
    } else {
        next(null, false);
    }
});

passport.use(strategy);

app.use(passport.initialize());

app.use(cors());
app.use(express.json());

app.get("/api/user/music", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const topRapAlbums = await lastfmService.getTopRapAlbums();
        res.json(topRapAlbums);
    } catch (error) {
        console.error('Error fetching data from Last.fm:', error);
        res.status(500).send('Error fetching data from Last.fm');
    }
});

app.get("/api/user/music/:artist/:album", passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { artist, album } = req.params;

    try {
        const albumInfo = await lastfmService.getAlbumInfo(artist, album);
        res.json(albumInfo);
    } catch (error) {
        console.error('Error fetching album info from Last.fm:', error);
        res.status(500).send('Error fetching album info from Last.fm');
    }
});

app.post("/api/user/getfavs", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const favorites = await userService.findFavourites(req.body);
        res.json(favorites);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

app.post("/api/user/favourites", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const favorites = await userService.addFavourite(req.body);
        res.json(favorites);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), async (req, res) => {
    // We modify favourites through adding and deleting so this endpoint is a bit redundant....
});

app.delete("/api/user/deletefavs", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const favorites = await userService.deleteFavourites(req.body);
        res.json(favorites);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

app.delete("/api/user/deleteallfavs", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const favorites = await userService.deleteAllFavourites(req.body);
        res.json(favorites);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

app.post("/api/user/gethistory", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const history = await userService.findHistory(req.body);
        res.json(history);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

app.post("/api/user/history", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const history = await userService.addHistory(req.body);
        res.json(history);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

app.put("/api/user/history/:id", passport.authenticate('jwt', { session: false }), async (req, res) => {
    // We modify history through adding and deleting so this endpoint is a bit redundant....
});

app.delete("/api/user/deletehistory", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const history = await userService.deleteHistory(req.body);
        res.json(history);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

app.delete("/api/user/deleteallhistory", passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const history = await userService.deleteAllHistory(req.body);
        res.json(history);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

app.post("/api/user/register", (req,res)=>{
    userService.registerUser(req.body).then(msg=>{
        res.json({message: msg});
    }).catch(msg=>{
        res.status(422).json({message: msg});
    });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
        .then((user) => {

            let payload = { 
                _id: user._id,
                userName: user.userName
            };
            
            let token = jwt.sign(payload, jwtOptions.secretOrKey);

            res.json({ "message": "login successful", "token": token });
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});

app.use((req, res) => {
    res.status(404).end();
});

userService.connect().then(()=>{
    app.listen(HTTP_PORT, ()=>{
        console.log("API listening on: " + HTTP_PORT);
    });
}).catch(err=>console.log(err))

