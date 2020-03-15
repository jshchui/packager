const http = require("https");
var fs = require("fs");
const minify = require("@node-minify/core");
const uglifyjs = require("@node-minify/uglify-js");
const cssnano = require("@node-minify/cssnano");
var Kraken = require("kraken");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

var kraken = new Kraken({
  api_key: process.env.KRAKEN_API_KEY,
  api_secret: process.env.KRAKEN_API_SECRET
});

// we initialize io here so the functions can use it later
var io;

const html2canvas = require("html2canvas");

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
    minifyFiles(pathToBanners);

    try {
      const test = "minifying was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });

  app.get("/api/renameFiles/", cors(), async (req, res, next) => {
    renameFiles(pathToBanners);

    try {
      const test = "renaming of files was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });

  app.get("/api/krakenPngs", cors(), async (req, res, next) => {
    krakenPngs(pathToBanners);

    try {
      const test = "krakening PNGs was initiated";
      res.json({ message: test });
    } catch (err) {
      console.log("error: ", err);
      next(err);
    }
  });

  app.get("/api/openIndex", cors(), async (req, res, next) => {
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

function newWindow(path, adNumber, pathToBanners) {
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
    console.log("quality before: ", quality);

    while (newImg.blob.size > 40000 && quality > 10) {
      console.log("blob size exceeded: ", newImg.blob.size);
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

let adNumber = 0;
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

          newWindow(currentPath, adNumber, pathToBanners);
          adNumber++;
        }
      });
    }
  });
}

let numFilesToMinify = 0;
function minifyFiles(path) {
  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let currentPath = `${path}/${file}`;
      let fileExtension = file.split(".").pop();

      if (fileExtension === "js" || fileExtension === "css") {
        numFilesToMinify++;
        console.log(`${fileExtension}, numFilesToMinify: `, numFilesToMinify);
      }

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);
        if (stats.isDirectory()) {
          minifyFiles(currentPath);
        } else if (fileExtension === "js") {
          minify({
            compressor: uglifyjs,
            input: `${currentPath}`,
            output: `${currentPath}`,
            callback: function(err, min) {
              if (err) console.log("err: ", err);
              numFilesToMinify--;
              console.log(
                "minifying JS completed, files left: ",
                numFilesToMinify
              );
              if (numFilesToMinify === 0) {
                io.emit("minify complete", "Minifying is completed!");
                numFilesToMinify = 0;
              }
              // if(min) console.log('min: ', min);
            }
          });
        } else if (fileExtension === "css") {
          minify({
            compressor: cssnano,
            input: `${currentPath}`,
            output: `${currentPath}`,
            callback: function(err, min) {
              if (err) console.log("err: ", err);
              numFilesToMinify--;
              console.log(
                "minifying CSS completed, files left: ",
                numFilesToMinify
              );
              if (numFilesToMinify === 0) {
                io.emit("minify complete", "Minifying is completed!");
                numFilesToMinify = 0;
              }
              // if(min) console.log('min: ', min);
            }
          });
        }
      });
    }
  });
}

let filesToKraken = 0;
let krakenErrors = [];
async function krakenPngs(path) {
  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let upOnePath = `${path}`;
      let currentPath = `${path}/${file}`;
      let fileExtension = file.split(".").pop();

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);
        if (stats.isDirectory()) {
          krakenPngs(currentPath);
        } else if (fileExtension === "png" || fileExtension === "PNG") {
          filesToKraken++;
          console.log(`${fileExtension}, filesToKrkaen: `, filesToKraken);

          var opts = {
            file: currentPath,
            wait: true,
            lossy: true
          };

          kraken.upload(opts, function(err, data) {
            if (err) {
              console.log("Failed. Error message: %s", err);
              krakenErrors.push = {
                fileName: file,
                error: err,
                path: path
              };
              filesToKraken--;
              console.log(`${fileExtension}, filesToKrkaen: `, filesToKraken);

              if (filesToKraken === 0) {
                io.emit("kraken complete", {
                  errors: krakenErrors,
                  message: `Kraken is completed${
                    krakenErrors.length ? " but there were errors" : "!"
                  }`
                });

                filesToKraken = 0;
                krakenErrors = [];
              }
            } else {
              console.log("Success. Optimized image URL: %s", data.kraked_url);
              console.log("currentPath: ", currentPath);
              filesToKraken--;
              console.log(`${fileExtension}, filesToKrkaen: `, filesToKraken);

              download(data.kraked_url, currentPath);
              if (filesToKraken === 0) {
                io.emit("kraken complete", {
                  errors: krakenErrors,
                  message: `Kraken is completed${
                    krakenErrors.length ? " but there were errors" : "!"
                  }`
                });

                filesToKraken = 0;
                krakenErrors = [];
              }
            }
          });
        }
      });
    }
  });
}

let foldersAndFilesToRename = 0;
let foldersRenamed = 0;
let filesRenamed = 0;
function renameFiles(path) {
  let regex = /_v[0-9][0-9]|_v[0-9]/g;

  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let upOnePath = `${path}`;
      let currentPath = `${path}/${file}`;

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);

        if (stats.isDirectory()) {
          if (regex.test(file)) {
            foldersAndFilesToRename++;
            console.log(
              "Detected Folder that needs renaming, foldersAndFilesToRename: ",
              foldersAndFilesToRename
            );

            let currentFileName = file;
            let newFileName = currentFileName.replace(regex, "");
            fs.rename(currentPath, `${upOnePath}/${newFileName}`, err => {
              if (err) throw err;
              foldersRenamed++;
              foldersAndFilesToRename--;
              console.log(
                "file renamed, foldersAndFilesToRename: ",
                foldersAndFilesToRename
              );
              // console.log(`"${file}" changed to "${newFileName}"`);

              if (foldersAndFilesToRename === 0) {
                io.emit(
                  "rename complete",
                  `Renaming Completed! Folders Renamed: ${foldersRenamed}, Files Renamed: ${filesRenamed}`
                );
                foldersAndFilesToRename = 0;
                foldersRenamed = 0;
                filesRenamed = 0;
              }
            });
          } else {
            renameFiles(currentPath);
          }
        } else if (stats.isFile()) {
          if (regex.test(file)) {
            foldersAndFilesToRename++;
            console.log(
              "Detected File that needs renaming, foldersAndFilesToRename: ",
              foldersAndFilesToRename
            );

            let currentFileName = file;
            let newFileName = currentFileName.replace(regex, "");
            fs.rename(currentPath, `${upOnePath}/${newFileName}`, err => {
              if (err) throw err;
              filesRenamed++;
              foldersAndFilesToRename--;
              console.log(
                "file renamed, foldersAndFilesToRename: ",
                foldersAndFilesToRename
              );
              // console.log(`"${file}" changed to "${newFileName}"`);

              if (foldersAndFilesToRename === 0) {
                io.emit(
                  "rename complete",
                  `Renaming Completed! Folders Renamed: ${foldersRenamed}, Files Renamed: ${filesRenamed}`
                );
                foldersAndFilesToRename = 0;
                foldersRenamed = 0;
                filesRenamed = 0;
              }
            });
          } else {
            // console.log(`"${file}" is unchanged`);
          }
        }
      });
    }
  });

  // console.log('I should be after most if not ALL of stuff')
  // return `Folders Renamed: ${foldersRenamed}, Files Renamed: ${filesRenamed}, Notes: ${(foldersAndFilesToRename === 0) ? 'Process Successful' : `Error occured, files and folders to rename is ${foldersAndFilesToRename} instead of 0`}`
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    // const file = fs.createWriteStream(dest, { flags: "wx" });
    const file = fs.createWriteStream(dest);

    const request = http.get(url, response => {
      console.log("response code: ", response.statusCode);
      if (response.statusCode === 200) {
        response.pipe(file);
      } else {
        file.close();
        console.log("unlinking file, status code was not 200");
        // fs.unlink(dest, () => {}); // Delete temp file
        reject(
          `Server responded with ${response.statusCode}: ${response.statusMessage}`
        );
      }
    });

    request.on("error", err => {
      console.log("error on request");
      file.close();
      // fs.unlink(dest, () => {}); // Delete temp file
      reject(err.message);
    });

    file.on("finish", () => {
      console.log("finish");
      resolve();
    });

    file.on("error", err => {
      console.log("error on file");
      file.close();

      if (err.code === "EEXIST") {
        reject("File already exists");
      } else {
        console.log("error on file deleting temp file");
        // fs.unlink(dest, () => {}); // Delete temp file
        reject(err.message);
      }
    });
  });
}

// prettier-ignore
function JPEGEncoder(quality) {
  var self = this;
  var fround = Math.round;
  var ffloor = Math.floor;
  var YTable = new Array(64);
  var UVTable = new Array(64);
  var fdtbl_Y = new Array(64);
  var fdtbl_UV = new Array(64);
  var YDC_HT;
  var UVDC_HT;
  var YAC_HT;
  var UVAC_HT;

  var bitcode = new Array(65535);
  var category = new Array(65535);
  var outputfDCTQuant = new Array(64);
  var DU = new Array(64);
  var byteout = [];
  var bytenew = 0;
  var bytepos = 7;

  var YDU = new Array(64);
  var UDU = new Array(64);
  var VDU = new Array(64);
  var clt = new Array(256);
  var RGB_YUV_TABLE = new Array(2048);
  var currentQuality;

  var ZigZag = [
    0, 1, 5, 6, 14, 15, 27, 28,
    2, 4, 7, 13, 16, 26, 29, 42,
    3, 8, 12, 17, 25, 30, 41, 43,
    9, 11, 18, 24, 31, 40, 44, 53,
    10, 19, 23, 32, 39, 45, 52, 54,
    20, 22, 33, 38, 46, 51, 55, 60,
    21, 34, 37, 47, 50, 56, 59, 61,
    35, 36, 48, 49, 57, 58, 62, 63
  ];

  var std_dc_luminance_nrcodes = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
  var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var std_ac_luminance_nrcodes = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
  var std_ac_luminance_values = [
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12,
    0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
    0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
    0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
    0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16,
    0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
    0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
    0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
    0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79,
    0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98,
    0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
    0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
    0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
    0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4,
    0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
    0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
    0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
    0xf9, 0xfa
  ];

  var std_dc_chrominance_nrcodes = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
  var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var std_ac_chrominance_nrcodes = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77];
  var std_ac_chrominance_values = [
    0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21,
    0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71,
    0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91,
    0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0,
    0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34,
    0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
    0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38,
    0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
    0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
    0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
    0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78,
    0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
    0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96,
    0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5,
    0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4,
    0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3,
    0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2,
    0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
    0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9,
    0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
    0xf9, 0xfa
  ];

  function initQuantTables(sf) {
    var YQT = [
      16, 11, 10, 16, 24, 40, 51, 61,
      12, 12, 14, 19, 26, 58, 60, 55,
      14, 13, 16, 24, 40, 57, 69, 56,
      14, 17, 22, 29, 51, 87, 80, 62,
      18, 22, 37, 56, 68, 109, 103, 77,
      24, 35, 55, 64, 81, 104, 113, 92,
      49, 64, 78, 87, 103, 121, 120, 101,
      72, 92, 95, 98, 112, 100, 103, 99
    ];

    for (var i = 0; i < 64; i++) {
      var t = ffloor((YQT[i] * sf + 50) / 100);
      if (t < 1) {
        t = 1;
      } else if (t > 255) {
        t = 255;
      }
      YTable[ZigZag[i]] = t;
    }
    var UVQT = [
      17, 18, 24, 47, 99, 99, 99, 99,
      18, 21, 26, 66, 99, 99, 99, 99,
      24, 26, 56, 99, 99, 99, 99, 99,
      47, 66, 99, 99, 99, 99, 99, 99,
      99, 99, 99, 99, 99, 99, 99, 99,
      99, 99, 99, 99, 99, 99, 99, 99,
      99, 99, 99, 99, 99, 99, 99, 99,
      99, 99, 99, 99, 99, 99, 99, 99
    ];
    for (var j = 0; j < 64; j++) {
      var u = ffloor((UVQT[j] * sf + 50) / 100);
      if (u < 1) {
        u = 1;
      } else if (u > 255) {
        u = 255;
      }
      UVTable[ZigZag[j]] = u;
    }
    var aasf = [
      1.0, 1.387039845, 1.306562965, 1.175875602,
      1.0, 0.785694958, 0.541196100, 0.275899379
    ];
    var k = 0;
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        fdtbl_Y[k] = (1.0 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
        fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
        k++;
      }
    }
  }

  function computeHuffmanTbl(nrcodes, std_table) {
    var codevalue = 0;
    var pos_in_table = 0;
    var HT = new Array();
    for (var k = 1; k <= 16; k++) {
      for (var j = 1; j <= nrcodes[k]; j++) {
        HT[std_table[pos_in_table]] = [];
        HT[std_table[pos_in_table]][0] = codevalue;
        HT[std_table[pos_in_table]][1] = k;
        pos_in_table++;
        codevalue++;
      }
      codevalue *= 2;
    }
    return HT;
  }

  function initHuffmanTbl() {
    YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes, std_dc_luminance_values);
    UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes, std_dc_chrominance_values);
    YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes, std_ac_luminance_values);
    UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes, std_ac_chrominance_values);
  }

  function initCategoryNumber() {
    var nrlower = 1;
    var nrupper = 2;
    for (var cat = 1; cat <= 15; cat++) {
      //Positive numbers
      for (var nr = nrlower; nr < nrupper; nr++) {
        category[32767 + nr] = cat;
        bitcode[32767 + nr] = [];
        bitcode[32767 + nr][1] = cat;
        bitcode[32767 + nr][0] = nr;
      }
      //Negative numbers
      for (var nrneg = -(nrupper - 1); nrneg <= -nrlower; nrneg++) {
        category[32767 + nrneg] = cat;
        bitcode[32767 + nrneg] = [];
        bitcode[32767 + nrneg][1] = cat;
        bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg;
      }
      nrlower <<= 1;
      nrupper <<= 1;
    }
  }

  function initRGBYUVTable() {
    for (var i = 0; i < 256; i++) {
      RGB_YUV_TABLE[i] = 19595 * i;
      RGB_YUV_TABLE[(i + 256) >> 0] = 38470 * i;
      RGB_YUV_TABLE[(i + 512) >> 0] = 7471 * i + 0x8000;
      RGB_YUV_TABLE[(i + 768) >> 0] = -11059 * i;
      RGB_YUV_TABLE[(i + 1024) >> 0] = -21709 * i;
      RGB_YUV_TABLE[(i + 1280) >> 0] = 32768 * i + 0x807FFF;
      RGB_YUV_TABLE[(i + 1536) >> 0] = -27439 * i;
      RGB_YUV_TABLE[(i + 1792) >> 0] = -5329 * i;
    }
  }

  // IO functions
  function writeBits(bs) {
    var value = bs[0];
    var posval = bs[1] - 1;
    while (posval >= 0) {
      if (value & (1 << posval)) {
        bytenew |= (1 << bytepos);
      }
      posval--;
      bytepos--;
      if (bytepos < 0) {
        if (bytenew == 0xFF) {
          writeByte(0xFF);
          writeByte(0);
        } else {
          writeByte(bytenew);
        }
        bytepos = 7;
        bytenew = 0;
      }
    }
  }

  function writeByte(value) {
    byteout.push(clt[value]); // write char directly instead of converting later
  }

  function writeWord(value) {
    writeByte((value >> 8) & 0xFF);
    writeByte((value) & 0xFF);
  }

  // DCT & quantization core
  function fDCTQuant(data, fdtbl) {
    var d0, d1, d2, d3, d4, d5, d6, d7;
    /* Pass 1: process rows. */
    var dataOff = 0;
    var i;
    const I8 = 8;
    const I64 = 64;
    for (i = 0; i < I8; ++i) {
      d0 = data[dataOff];
      d1 = data[dataOff + 1];
      d2 = data[dataOff + 2];
      d3 = data[dataOff + 3];
      d4 = data[dataOff + 4];
      d5 = data[dataOff + 5];
      d6 = data[dataOff + 6];
      d7 = data[dataOff + 7];

      var tmp0 = d0 + d7;
      var tmp7 = d0 - d7;
      var tmp1 = d1 + d6;
      var tmp6 = d1 - d6;
      var tmp2 = d2 + d5;
      var tmp5 = d2 - d5;
      var tmp3 = d3 + d4;
      var tmp4 = d3 - d4;

      /* Even part */
      var tmp10 = tmp0 + tmp3; /* phase 2 */
      var tmp13 = tmp0 - tmp3;
      var tmp11 = tmp1 + tmp2;
      var tmp12 = tmp1 - tmp2;

      data[dataOff] = tmp10 + tmp11; /* phase 3 */
      data[dataOff + 4] = tmp10 - tmp11;

      var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
      data[dataOff + 2] = tmp13 + z1; /* phase 5 */
      data[dataOff + 6] = tmp13 - z1;

      /* Odd part */
      tmp10 = tmp4 + tmp5; /* phase 2 */
      tmp11 = tmp5 + tmp6;
      tmp12 = tmp6 + tmp7;

      /* The rotator is modified from fig 4-8 to avoid extra negations. */
      var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
      var z2 = 0.541196100 * tmp10 + z5; /* c2-c6 */
      var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
      var z3 = tmp11 * 0.707106781; /* c4 */

      var z11 = tmp7 + z3; /* phase 5 */
      var z13 = tmp7 - z3;

      data[dataOff + 5] = z13 + z2; /* phase 6 */
      data[dataOff + 3] = z13 - z2;
      data[dataOff + 1] = z11 + z4;
      data[dataOff + 7] = z11 - z4;

      dataOff += 8; /* advance pointer to next row */
    }

    /* Pass 2: process columns. */
    dataOff = 0;
    for (i = 0; i < I8; ++i) {
      d0 = data[dataOff];
      d1 = data[dataOff + 8];
      d2 = data[dataOff + 16];
      d3 = data[dataOff + 24];
      d4 = data[dataOff + 32];
      d5 = data[dataOff + 40];
      d6 = data[dataOff + 48];
      d7 = data[dataOff + 56];

      var tmp0p2 = d0 + d7;
      var tmp7p2 = d0 - d7;
      var tmp1p2 = d1 + d6;
      var tmp6p2 = d1 - d6;
      var tmp2p2 = d2 + d5;
      var tmp5p2 = d2 - d5;
      var tmp3p2 = d3 + d4;
      var tmp4p2 = d3 - d4;

      /* Even part */
      var tmp10p2 = tmp0p2 + tmp3p2; /* phase 2 */
      var tmp13p2 = tmp0p2 - tmp3p2;
      var tmp11p2 = tmp1p2 + tmp2p2;
      var tmp12p2 = tmp1p2 - tmp2p2;

      data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
      data[dataOff + 32] = tmp10p2 - tmp11p2;

      var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
      data[dataOff + 16] = tmp13p2 + z1p2; /* phase 5 */
      data[dataOff + 48] = tmp13p2 - z1p2;

      /* Odd part */
      tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
      tmp11p2 = tmp5p2 + tmp6p2;
      tmp12p2 = tmp6p2 + tmp7p2;

      /* The rotator is modified from fig 4-8 to avoid extra negations. */
      var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
      var z2p2 = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
      var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
      var z3p2 = tmp11p2 * 0.707106781; /* c4 */
      var z11p2 = tmp7p2 + z3p2; /* phase 5 */
      var z13p2 = tmp7p2 - z3p2;

      data[dataOff + 40] = z13p2 + z2p2; /* phase 6 */
      data[dataOff + 24] = z13p2 - z2p2;
      data[dataOff + 8] = z11p2 + z4p2;
      data[dataOff + 56] = z11p2 - z4p2;

      dataOff++; /* advance pointer to next column */
    }

    // Quantize/descale the coefficients
    var fDCTQuant;
    for (i = 0; i < I64; ++i) {
      // Apply the quantization and scaling factor & Round to nearest integer
      fDCTQuant = data[i] * fdtbl[i];
      outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5) | 0) : ((fDCTQuant - 0.5) | 0);
      //outputfDCTQuant[i] = fround(fDCTQuant);

    }
    return outputfDCTQuant;
  }

  function writeAPP0() {
    writeWord(0xFFE0); // marker
    writeWord(16); // length
    writeByte(0x4A); // J
    writeByte(0x46); // F
    writeByte(0x49); // I
    writeByte(0x46); // F
    writeByte(0); // = "JFIF",'\0'
    writeByte(1); // versionhi
    writeByte(1); // versionlo
    writeByte(0); // xyunits
    writeWord(1); // xdensity
    writeWord(1); // ydensity
    writeByte(0); // thumbnwidth
    writeByte(0); // thumbnheight
  }

  function writeSOF0(width, height) {
    writeWord(0xFFC0); // marker
    writeWord(17); // length, truecolor YUV JPG
    writeByte(8); // precision
    writeWord(height);
    writeWord(width);
    writeByte(3); // nrofcomponents
    writeByte(1); // IdY
    writeByte(0x11); // HVY
    writeByte(0); // QTY
    writeByte(2); // IdU
    writeByte(0x11); // HVU
    writeByte(1); // QTU
    writeByte(3); // IdV
    writeByte(0x11); // HVV
    writeByte(1); // QTV
  }

  function writeDQT() {
    writeWord(0xFFDB); // marker
    writeWord(132); // length
    writeByte(0);
    for (var i = 0; i < 64; i++) {
      writeByte(YTable[i]);
    }
    writeByte(1);
    for (var j = 0; j < 64; j++) {
      writeByte(UVTable[j]);
    }
  }

  function writeDHT() {
    writeWord(0xFFC4); // marker
    writeWord(0x01A2); // length

    writeByte(0); // HTYDCinfo
    for (var i = 0; i < 16; i++) {
      writeByte(std_dc_luminance_nrcodes[i + 1]);
    }
    for (var j = 0; j <= 11; j++) {
      writeByte(std_dc_luminance_values[j]);
    }

    writeByte(0x10); // HTYACinfo
    for (var k = 0; k < 16; k++) {
      writeByte(std_ac_luminance_nrcodes[k + 1]);
    }
    for (var l = 0; l <= 161; l++) {
      writeByte(std_ac_luminance_values[l]);
    }

    writeByte(1); // HTUDCinfo
    for (var m = 0; m < 16; m++) {
      writeByte(std_dc_chrominance_nrcodes[m + 1]);
    }
    for (var n = 0; n <= 11; n++) {
      writeByte(std_dc_chrominance_values[n]);
    }

    writeByte(0x11); // HTUACinfo
    for (var o = 0; o < 16; o++) {
      writeByte(std_ac_chrominance_nrcodes[o + 1]);
    }
    for (var p = 0; p <= 161; p++) {
      writeByte(std_ac_chrominance_values[p]);
    }
  }

  function writeSOS() {
    writeWord(0xFFDA); // marker
    writeWord(12); // length
    writeByte(3); // nrofcomponents
    writeByte(1); // IdY
    writeByte(0); // HTY
    writeByte(2); // IdU
    writeByte(0x11); // HTU
    writeByte(3); // IdV
    writeByte(0x11); // HTV
    writeByte(0); // Ss
    writeByte(0x3f); // Se
    writeByte(0); // Bf
  }

  function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
    var EOB = HTAC[0x00];
    var M16zeroes = HTAC[0xF0];
    var pos;
    const I16 = 16;
    const I63 = 63;
    const I64 = 64;
    var DU_DCT = fDCTQuant(CDU, fdtbl);
    //ZigZag reorder
    for (var j = 0; j < I64; ++j) {
      DU[ZigZag[j]] = DU_DCT[j];
    }
    var Diff = DU[0] - DC;
    DC = DU[0];
    //Encode DC
    if (Diff == 0) {
      writeBits(HTDC[0]); // Diff might be 0
    } else {
      pos = 32767 + Diff;
      writeBits(HTDC[category[pos]]);
      writeBits(bitcode[pos]);
    }
    //Encode ACs
    var end0pos = 63; // was const... which is crazy
    for (;
      (end0pos > 0) && (DU[end0pos] == 0); end0pos--) {};
    //end0pos = first element in reverse order !=0
    if (end0pos == 0) {
      writeBits(EOB);
      return DC;
    }
    var i = 1;
    var lng;
    while (i <= end0pos) {
      var startpos = i;
      for (;
        (DU[i] == 0) && (i <= end0pos); ++i) {}
      var nrzeroes = i - startpos;
      if (nrzeroes >= I16) {
        lng = nrzeroes >> 4;
        for (var nrmarker = 1; nrmarker <= lng; ++nrmarker)
          writeBits(M16zeroes);
        nrzeroes = nrzeroes & 0xF;
      }
      pos = 32767 + DU[i];
      writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
      writeBits(bitcode[pos]);
      i++;
    }
    if (end0pos != I63) {
      writeBits(EOB);
    }
    return DC;
  }

  function initCharLookupTable() {
    var sfcc = String.fromCharCode;
    for (var i = 0; i < 256; i++) { ///// ACHTUNG // 255
      clt[i] = sfcc(i);
    }
  }

  this.encode = function(image, quality, toRaw) // image data object
    {
      var time_start = new Date().getTime();

      if (quality) setQuality(quality);

      // Initialize bit writer
      byteout = new Array();
      bytenew = 0;
      bytepos = 7;

      // Add JPEG headers
      writeWord(0xFFD8); // SOI
      writeAPP0();
      writeDQT();
      writeSOF0(image.width, image.height);
      writeDHT();
      writeSOS();

      // Encode 8x8 macroblocks
      var DCY = 0;
      var DCU = 0;
      var DCV = 0;

      bytenew = 0;
      bytepos = 7;

      this.encode.displayName = "_encode_";

      var imageData = image.data;
      var width = image.width;
      var height = image.height;

      var quadWidth = width * 4;
      var tripleWidth = width * 3;

      var x, y = 0;
      var r, g, b;
      var start, p, col, row, pos;
      while (y < height) {
        x = 0;
        while (x < quadWidth) {
          start = quadWidth * y + x;
          p = start;
          col = -1;
          row = 0;

          for (pos = 0; pos < 64; pos++) {
            row = pos >> 3; // /8
            col = (pos & 7) * 4; // %8
            p = start + (row * quadWidth) + col;

            if (y + row >= height) { // padding bottom
              p -= (quadWidth * (y + 1 + row - height));
            }

            if (x + col >= quadWidth) { // padding right
              p -= ((x + col) - quadWidth + 4)
            }

            r = imageData[p++];
            g = imageData[p++];
            b = imageData[p++];

            /* // calculate YUV values dynamically
            YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
            UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
            VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
            */

            // use lookup table (slightly faster)
            YDU[pos] = ((RGB_YUV_TABLE[r] + RGB_YUV_TABLE[(g + 256) >> 0] + RGB_YUV_TABLE[(b + 512) >> 0]) >> 16) - 128;
            UDU[pos] = ((RGB_YUV_TABLE[(r + 768) >> 0] + RGB_YUV_TABLE[(g + 1024) >> 0] + RGB_YUV_TABLE[(b + 1280) >> 0]) >> 16) - 128;
            VDU[pos] = ((RGB_YUV_TABLE[(r + 1280) >> 0] + RGB_YUV_TABLE[(g + 1536) >> 0] + RGB_YUV_TABLE[(b + 1792) >> 0]) >> 16) - 128;

          }

          DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
          DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
          DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
          x += 32;
        }
        y += 8;
      }

      ////////////////////////////////////////////////////////////////

      // Do the bit alignment of the EOI marker
      if (bytepos >= 0) {
        var fillbits = [];
        fillbits[1] = bytepos + 1;
        fillbits[0] = (1 << (bytepos + 1)) - 1;
        writeBits(fillbits);
      }

      writeWord(0xFFD9); //EOI

      if (toRaw) {
        var len = byteout.length;
        var data = new Uint8Array(len);

        for (var i = 0; i < len; i++) {
          data[i] = byteout[i].charCodeAt();
        }

        //cleanup
        byteout = [];

        // benchmarking
        var duration = new Date().getTime() - time_start;
        console.log('Encoding time: ' + duration + 'ms');

        return data;
      }

      var jpegDataUri = 'data:image/jpeg;base64,' + btoa(byteout.join(''));

      byteout = [];

      // benchmarking
      var duration = new Date().getTime() - time_start;
      console.log('Encoding time: ' + duration + 'ms');

      return jpegDataUri
    }

  function setQuality(quality) {
    if (quality <= 0) {
      quality = 1;
    }
    if (quality > 100) {
      quality = 100;
    }

    if (currentQuality == quality) return // don't recalc if unchanged

    var sf = 0;
    if (quality < 50) {
      sf = Math.floor(5000 / quality);
    } else {
      sf = Math.floor(200 - quality * 2);
    }

    initQuantTables(sf);
    currentQuality = quality;
    console.log('Quality set to: ' + quality + '%');
  }

  function init() {
    var time_start = new Date().getTime();
    if (!quality) quality = 50;
    // Create tables
    initCharLookupTable()
    initHuffmanTbl();
    initCategoryNumber();
    initRGBYUVTable();

    setQuality(quality);
    var duration = new Date().getTime() - time_start;
    console.log('Initialization ' + duration + 'ms');
  }

  init();

}

function formatBytes(bytes, decimals) {
  if (bytes == 0) return "0 Bytes";
  var k = 1000,
    dm = decimals + 1 || 3,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/*
 +-+-+-+-+-+-+-+-+-+-+-+-+-+
 |d|o|w|n|l|o|a|d|A|s|J|P|G|
 +-+-+-+-+-+-+-+-+-+-+-+-+-+                                             
*/
function createBlob(ctx, quality, w, h) {
  var imgData = ctx.getImageData(0, 0, w, h);
  var encoder = new JPEGEncoder(quality);
  var jpegURI = encoder.encode(imgData, quality, true);
  var blob = new Blob([jpegURI.buffer], {
    type: "image/jpeg"
  });
  var size = formatBytes(blob.size, 1);
  return {
    blob: blob,
    size: size
  };
}

function downloadAsJPG(ctx, quality, w, h, borderColor) {
  /****/
  //Draw the border
  ctx.beginPath();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.rect(0, 0, w, h);
  ctx.stroke();
  /****/

  /*
  var imgData = (ctx.getImageData(0, 0, w, h));
  var encoder = new JPEGEncoder(quality);
  var jpegURI = encoder.encode(imgData, quality, true);
  var blob = new Blob([jpegURI.buffer], {type: 'image/jpeg'});
  */
  var blob = createBlob(ctx, quality, w, h);
  //var dt = canvas.toDataURL('image/jpeg');
  var img = new Image();
  img.src = URL.createObjectURL(blob.blob); //jpegURI; //dt;
  var size = formatBytes(blob.size, 1);

  // return img;
  return blob;
  // var link = document.createElement("a");
  // link.href = img.src;
  // var fn = $("#filename").val();
  // if (fn == "") {
  //   fn = "backup" + $("#width").val() + "x" + $("#height").val();
  // }
  // link.download = fn + ".jpg";
  // var evt = new MouseEvent("click", {
  //   view: window,
  //   bubbles: true,
  //   cancelable: true
  // });
  // link.dispatchEvent(evt);
}

function updateSize(bannerCTX, quality, w, h) {
  var size = createBlob(bannerCTX, quality, w, h).size;
  return size;
}
