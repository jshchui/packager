var fs = require("fs");

let indexFilesToCheck = 0;
let filesChecked = 0;
const validateData = [];

const validateBuilds = (path, io) => {

  // for some reason adding g at the end of regex makes it so that it will detect
  // _v1 but not v2, but if you check v2 first, _v1 will not work
  let regex = /_v[0-9][0-9]|_v[0-9]/;
  let buildSizeRegex = /([0-9][0-9][0-9]|[0-9][0-9])x([0-9][0-9][0-9]|[0-9][0-9])/g

  fs.readdir(path, (err, files) => {
    for(const file of files) {
      let currentPath = `${path}/${file}`

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);

        if (stats.isDirectory()) {
          if (regex.test(file)) {
            // this means that this is a build
            validateBuilds(currentPath, io);
          }
        } else if (stats.isFile()) {
          let fileExtension = file.split(".").pop();
          if (fileExtension === "html") {
            indexFilesToCheck += 1;

            fetch(currentPath)
            .then(response => response.text())
            .then(text => {

              const parser = new DOMParser();
              const doc = parser.parseFromString(text, 'text/html');

              const buildSizeArray = currentPath.match(buildSizeRegex)[0].split('x');
              const buildMatchingMeta = `width=${buildSizeArray[0]},height=${buildSizeArray[1]}`.trim()
              
              const meta = doc.querySelector('meta[name="ad.size"]').content;
              const metaMatchesBuildSize = buildMatchingMeta === meta;

              if (metaMatchesBuildSize === false) {
                validateData.push({
                  path: currentPath,
                  meta,
                  indexName: buildMatchingMeta,
                })
              }

              filesChecked += 1;

              if (filesChecked === indexFilesToCheck) {
                if (io) {
                  io.emit("validation complete", {
                    errors: validateData,
                    message: `Number of errors: ${validateData.length}`
                  })
                }
              }
            }).catch(function (err) {
              // There was an error
              console.warn('Something went wrong.', err);
            });
          }
        }
      })
    }
  })
}

module.exports = validateBuilds;