var fs = require("fs");

// Modules
const renameFiles = require("./modules/renameFiles.js");
const minifyFiles = require("./modules/minifyFiles.js");
const krakenFiles = require("./modules/krakenFiles.js");
const validateBuilds = require("./modules/validateBuilds.js");
const checkFileType = require("./modules/checkFileType.js");
const openIndex = require("./modules/openIndex.js");

// we initialize io here so the functions can use it later
var io;

(function() {
  "use strict";
  var fixPath = require("fix-path");
  let express = require("express");
  let app = express();

  let server = app.listen(3000, function() {
    console.log("Express server listening on port " + server.address().port);
  });

  const cors = require("cors");

  var bodyParser = require("body-parser");

  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      // to support URL-encoded bodies
      extended: true
    })
  );

  io = require("socket.io").listen(server);

  io.on("connection", function(socket) {
    console.log("a user has connected");

    socket.on("disconnect", function() {
      console.log("user disconnected");
    });
  });

  // this determines path to where banners should be, but it is defaulted to the banner in this project
  let pathToBanners = `${__dirname}/banners`;
  fixPath();

  app.get("/", function(req, res) {
    res.send("Hello world! Lala Seth is here!");
  });

  app.get("/api/minify/", cors(), async (req, res, next) => {
    const minifyFileValue = await minifyFiles(pathToBanners, io);

    try {
      const test = "minifying was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });

  app.get("/api/renameFiles/", cors(), async (req, res, next) => {
    const renameFileValue = await renameFiles(pathToBanners, io);

    try {
      const test = "renaming of files was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });

  app.get("/api/krakenPngs", cors(), async (req, res, next) => {
    krakenFiles(pathToBanners, io);

    try {
      const test = "krakening PNGs was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });

  app.post("/api/openIndex", cors(), async (req, res, next) => {
    let generateToRootChecked;
    if (req.body && req.body.generateBackUpsToRootChecked) {
      generateToRootChecked = req.body.generateBackUpsToRootChecked;
      console.log('generate root cheecked: ', req.body.generateBackUpsToRootChecked);
    }


    if(generateToRootChecked) {
      const backupPath = `${pathToBanners}/00_backups`
      const backupPathExists = fs.existsSync(backupPath)
      if(!backupPathExists) {
        fs.mkdirSync(backupPath);
      }
    }
    openIndex(pathToBanners, pathToBanners, generateToRootChecked);
    // startCapture(displayMediaOptions);

    try {
      const test = "Open Index was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });

  app.get("/api/validateBuilds", cors(), async (req, res, next) => {
    validateBuilds(pathToBanners, io);

    try {
      const test = "Validate Builds was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });
  
  app.get("/api/checkFileType", cors(), async (req, res, next) => {
    checkFileType(pathToBanners, io);

    try {
      const test = "Check File Type was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });

  // app.get('/api/ping/', cors(), async(req, res, next) => {
  app.post("/api/ping/", cors(), async (req, res) => {
    if (req.body && req.body.path) pathToBanners = req.body.path;

    let message;

    try {
      if (pathToBanners) {
        message = `backend is online with path set to ${pathToBanners}`;
      } else {
        message = "backend is online, using default banner folder.";
      }
      res.json({
        message,
        pathToBanners
      });
    } catch (err) {
      console.log("error from ping: ", err);
      next(err);
    }
  });

  module.exports = app;
})();