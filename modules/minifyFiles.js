var fs = require("fs");
const minify = require("@node-minify/core");
const uglifyjs = require("@node-minify/uglify-js");
const cssnano = require("@node-minify/cssnano");

const minifyFiles = (path, io) => {

  let numFilesToMinify = 0;
  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let currentPath = `${path}/${file}`;
      let fileExtension = file.split(".").pop();

      if (fileExtension === "js" || fileExtension === "css") {
        numFilesToMinify++;
        // console.log(`${fileExtension}, numFilesToMinify: `, numFilesToMinify);
      }

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);
        if (stats.isDirectory()) {
          minifyFiles(currentPath, io);
        } else if (fileExtension === "js") {
          doMinify(currentPath, uglifyjs).then((min, err) => {
            // if (err) console.log('err: ', err);
            // console.log('min: ', min)
            numFilesToMinify--;
            if (numFilesToMinify === 0) {
              if(io) io.emit("minify complete", "Minifying is completed!");
              numFilesToMinify = 0;
            }
          })
        } else if (fileExtension === "css") {
          doMinify(currentPath, cssnano).then((min, err) => {
            // if (err) console.log('err: ', err);
            // console.log('min: ', min)
            numFilesToMinify--;
            if (numFilesToMinify === 0) {
              if(io) io.emit("minify complete", "Minifying is completed!");
              numFilesToMinify = 0;
            }
          })
        }
      });
    }
  });

  return "minifyFiles was called";

};


async function doMinify(currentPath, compressor) {
  const min = await minify({
    compressor: compressor,
    input: `${currentPath}`,
    output: `${currentPath}`
  })

  return min;
}


module.exports = minifyFiles;
