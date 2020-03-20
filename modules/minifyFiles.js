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
        console.log(`${fileExtension}, numFilesToMinify: `, numFilesToMinify);
      }

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);
        if (stats.isDirectory()) {
          minifyFiles(currentPath, io);
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
                console.log('i should be emiting from js')
                if(io) io.emit("minify complete", "Minifying is completed!");
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
                console.log('i should be emiting from css and io: ', io)
                if(io) {
                  console.log('io YAY')
                  io.emit("minify complete", "Minifying is completed!");
                }
                numFilesToMinify = 0;
              }
              // if(min) console.log('min: ', min);
            }
          });
        }
      });
    }
  });

  return "minifyFiles was called";

}

module.exports = minifyFiles;
