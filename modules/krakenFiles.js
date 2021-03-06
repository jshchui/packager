const http = require("https");
const fs = require("fs");
const Kraken = require("kraken");
const envDirectory = __dirname.replace("modules", "") + ".env";
require("dotenv").config({ path: envDirectory });

// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config();
// }

const kraken = new Kraken({
  api_key: process.env.KRAKEN_API_KEY,
  api_secret: process.env.KRAKEN_API_SECRET,
});

let filesToKrakenCheckInitiated = false;
let krakenErrors = [];
let filesToKraken = 0;
let filesChecked = 0;

const countFilesToKraken = (path) => {
  fs.readdir(path, (err, files) => {
    const filterFiles = files.filter((file) => {
      const extension = file.split(".").pop();
      return ["png", "PNG"].includes(extension);
    });

    filesToKraken += filterFiles.length;

    for (const file of files) {
      let currentPath = `${path}/${file}`;

      fs.lstat(currentPath, (err, stats) => {
        if (stats.isDirectory()) {
          countFilesToKraken(currentPath);
        }
      });
    }
  });
};

async function krakenPngs(path, io) {
  if (!filesToKrakenCheckInitiated) {
    countFilesToKraken(path);
    filesToKrakenCheckInitiated = true;
  }

  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let upOnePath = `${path}`;
      let currentPath = `${path}/${file}`;
      let fileExtension = file.split(".").pop();

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);
        if (stats.isDirectory()) {
          krakenPngs(currentPath, io);
        } else if (fileExtension === "png" || fileExtension === "PNG") {
          var opts = {
            file: currentPath,
            wait: true,
            lossy: true,
          };

          kraken.upload(opts, function (err, data) {
            if (err) {
              krakenErrors.push({
                fileName: file,
                error: err.toString(),
                path: path,
              });
              filesChecked++;

              if (filesChecked === filesToKraken) {
                if (io) {
                  io.emit("kraken complete", {
                    errors: krakenErrors,
                    message: `Kraken is completed${
                      krakenErrors.length ? " but there were errors" : "!"
                    }`,
                  });
                }

                console.log("krakenErrors on Error: ", krakenErrors);

                filesToKraken = 0;
                filesChecked = 0;
                krakenErrors = [];
                filesToKrakenCheckInitiated = false;
              }
            } else {
              // console.log("Success. Optimized image URL: %s", data.kraked_url);
              // console.log("currentPath: ", currentPath);
              filesChecked++;

              download(data.kraked_url, currentPath);
              if (filesChecked === filesToKraken) {
                if (io) {
                  io.emit("kraken complete", {
                    errors: krakenErrors,
                    message: `Kraken is completed${
                      krakenErrors.length ? " but there were errors" : "!"
                    }`,
                  });
                }
                console.log("krakenErrors on Download: ", krakenErrors);

                filesToKraken = 0;
                filesChecked = 0;
                krakenErrors = [];
                filesToKrakenCheckInitiated = false;
              }
            }
          });
        }
      });
    }
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    // const file = fs.createWriteStream(dest, { flags: "wx" });
    const file = fs.createWriteStream(dest);

    const request = http.get(url, (response) => {
      // console.log("response code: ", response.statusCode);
      if (response.statusCode === 200) {
        response.pipe(file);
      } else {
        file.close();
        console.log("DOWNLOAD... unlinking file, status code was not 200");
        // fs.unlink(dest, () => {}); // Delete temp file
        reject(
          `Server responded with ${response.statusCode}: ${response.statusMessage}`
        );
      }
    });

    request.on("error", (err) => {
      console.log("DOWNLOAD... error on request");
      krakenErrors.push({
        error: err,
        errorMessage: err && err.message,
        path: dest,
      });

      console.log("krakenErrors right after error on request: ", krakenErrors);
      file.close();
      // fs.unlink(dest, () => {}); // Delete temp file
      reject(err.message);
    });

    file.on("finish", () => {
      console.log("DOWNLOAD... file on FINISH");
      resolve();
    });

    file.on("error", (err) => {
      console.log("DOWNLOAD... error on file");
      krakenErrors.push({
        error: err,
        errorMessage: err && err.message,

        path: dest,
      });
      file.close();

      if (err.code === "EEXIST") {
        reject("DOWNLAOD... ile already exists");
      } else {
        krakenErrors.push({
          error: err,
          errorMessage: err && err.message,

          path: dest,
        });
        console.log("DOWNLOAD... error on file deleting temp file");
        // fs.unlink(dest, () => {}); // Delete temp file
        reject(err.message);
      }
    });
  });
}

module.exports = krakenPngs;
