const http = require("https");
const fs = require("fs");
const Kraken = require("kraken");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const kraken = new Kraken({
  api_key: process.env.KRAKEN_API_KEY,
  api_secret: process.env.KRAKEN_API_SECRET
});

async function krakenPngs(path, io) {
  let filesToKraken = 0;
  let krakenErrors = [];
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
                if (io) {
                  io.emit("kraken complete", {
                    errors: krakenErrors,
                    message: `Kraken is completed${
                      krakenErrors.length ? " but there were errors" : "!"
                    }`
                  });
                }

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
                if (io) {
                  io.emit("kraken complete", {
                    errors: krakenErrors,
                    message: `Kraken is completed${
                      krakenErrors.length ? " but there were errors" : "!"
                    }`
                  });
                }

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

module.exports = krakenPngs;
