var fs = require("fs");

// Modules
const renameFiles = require("./modules/renameFiles.js");
const minifyFiles = require("./modules/minifyFiles.js");
const krakenFiles = require("./modules/krakenFiles.js");
const { downloadAsJPG } = require("./modules/encoder.js");

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

  app.get("/api/openIndex", cors(), async (req, res, next) => {
    const backupPath = `${pathToBanners}/00_backups`
    const backupPathExists = fs.existsSync(backupPath)
    if(!backupPathExists) {
      fs.mkdirSync(backupPath);
    }
    openIndex(pathToBanners, pathToBanners);
    // startCapture(displayMediaOptions);

    try {
      const test = "Open Index was initiated";
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

function newWindow(path, pathToBanners) {
  var win = window.open(path, "_blank", "nodeIntegration=true");

  var script = document.createElement("script");
  script.src = `${__dirname}\\loadbanner.js`;
  script.type = "module";

  win.onload = function() {
    try {
      console.log("try");
      win.document.body.appendChild(script);
    } catch (e) {
      console.log("catch e: ", e);
      win.document.body.appendChild(script);
    }

    // we add a adNum data here so we can use it when we open the ads invidually
    win.document.body.insertAdjacentHTML(
      "beforeend",
      `<span id="directory">${__dirname}</span>`
    );

    const imagesInBanner = [...win.document.getElementsByTagName("img")];
    const imagesBannerSource = [];

    for (let i = 0; i < imagesInBanner.length; i++) {
      imagesBannerSource.push(imagesInBanner[i].src);
      imagesInBanner[i].setAttribute("src", imagesInBanner[i].src);
    }

    const checkBannerComplete = setInterval(() => {
      const isBannerFinishedSpan = win.document.getElementById(
        "bannerFinished"
      );
      if (isBannerFinishedSpan) {
        clearInterval(checkBannerComplete);
        takeScreenshot(win, path, pathToBanners);
      }
    }, 2000);
  };
}

function takeScreenshot(win, path, pathToBanners) {
  console.log("taking screenshot:", win);
  const screenshot = win.document.getElementById(`myScreenshot`);
  console.log("screenshot: ", screenshot);
  const screenshotGetContext = screenshot.getContext("2d");
  let quality = 100;
  if (screenshot) {
    var img = new Image();
    img.src = screenshot.toDataURL("image/jpg");

    var imageData = img.src.replace(/^data:image\/(png|jpg);base64,/, "");
    let newImg = downloadAsJPG(
      screenshotGetContext,
      quality,
      screenshot.width,
      screenshot.height,
      "black"
    );
    // console.log("quality before: ", quality);

    while (newImg.blob.size > 40000 && quality > 10) {
      // console.log("blob size exceeded: ", newImg.blob.size);
      if (newImg.blob.size > 50000) {
        quality -= 5;
      } else {
        quality -= 2;
      }
      newImg = downloadAsJPG(
        screenshotGetContext,
        quality,
        screenshot.width,
        screenshot.height,
        "black"
      );
    }

    console.log("quality: ", quality);

    const splitPathArray = path && path.split("/");
    const splitPathName = splitPathArray[splitPathArray.length - 2];

    // convert blob back to base64data
    var reader = new FileReader();
    reader.readAsDataURL(newImg.blob);
    reader.onloadend = function() {
      var base64data = reader.result;
      var baseData = base64data.replace(/^data:image\/(png|jpeg);base64,/, "");
      fs.writeFile(
        `${pathToBanners}/00_backups/${splitPathName}_backup.jpg`, // it was `./backups/image_${adNumber}.jpg`, before
        baseData,
        "base64",
        function(err) {
          console.log("err: ", err);
        }
      );
    };
    win.close();
  } else {
    console.log("no screenshot exists");
  }
}

// we set another path to banners after path because we want the original path so it can save backups there
function openIndex(path, pathToBanners) {
  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let currentPath = `${path}/${file}`;
      let fileExtension = file.split(".").pop();

      fs.lstat(currentPath, (err, stats) => {
        if (stats.isDirectory()) {
          openIndex(currentPath, pathToBanners);
        } else if (fileExtension === "html") {
          console.log(`html file: ${file}, path: ${currentPath}`);

          newWindow(currentPath, pathToBanners);
        }
      });
    }
  });
}