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
    openIndex(pathToBanners);
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

function newWindow(path, adNumber) {
  var win = window.open(path, "_blank", "nodeIntegration=true");

  var script = document.createElement("script");
  script.src = `${__dirname}/loadbanner.js`;
  script.type = "module";

  var requireScript = document.createElement("script");
  requireScript.src = `C:\\Users\\Jack\\Desktop\\Packagers\\V6dTransfer\\require.js`;
  // requireScript.src = `${__dirname}/require.js`;
  requireScript.setAttribute("data-main", "loadbanner");

  win.onload = function() {
    win.document.head.appendChild(requireScript);
    win.document.head.appendChild(script);
    console.log("done loading");
    //   win.document.head.innerHTML = '<title>Hi</title></head>';
    // win.document.body.innerHTML = '<body>Sample text</body>';

    // we add a adNum data here so we can use it when we open the ads invidually
    win.document.body.insertAdjacentHTML(
      "beforeend",
      `<span id="adNum">${adNumber}</span>`
    );

    console.log("window.documnent: ", win.document);
    const imagesInBanner = [...win.document.getElementsByTagName("img")];
    const imagesBannerSource = [];
    console.log("images: ", imagesInBanner);

    for (let i = 0; i < imagesInBanner.length; i++) {
      imagesBannerSource.push(imagesInBanner[i].src);
      imagesInBanner[i].setAttribute("src", imagesInBanner[i].src);
    }

    setTimeout(() => {
      const screenshot = win.document.getElementById(
        `myScreenshot_${adNumber}`
      );
      document.body.appendChild(screenshot);
    }, 12000);

    // win.document.body.appendChild(requireScript);
    // win.document.body.appendChild(script);
  };
}

let adNumber = 0;
function openIndex(path) {
  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let currentPath = `${path}/${file}`;
      let fileExtension = file.split(".").pop();

      fs.lstat(currentPath, (err, stats) => {
        if (stats.isDirectory()) {
          openIndex(currentPath);
        } else if (fileExtension === "html") {
          console.log(`html file: ${file}, path: ${currentPath}`);

          newWindow(currentPath, adNumber);
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
