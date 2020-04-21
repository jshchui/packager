// checks if file extension matches file type
var fs = require("fs")

const readChunk = require('read-chunk');
const imageType = require('image-type');

let filesToCheck = 0;
let filesChecked = 0;
let filesToCheckInitiated = false;
let typeMismatches = []


const countFiles = (path) => {
  fs.readdir(path, (err, files) => {
     const filterFiles = files.filter(file => {
      const extension = file.split('.').pop();
      return  ['png', 'jpg'].includes(extension);
    })

    filesToCheck += filterFiles.length;

    for (const file of files) {
      let currentPath = `${path}/${file}`;
      
      fs.lstat(currentPath, (err, stats) => {
        if (stats.isDirectory()) {
          countFiles(currentPath);
        }
      })
    }
  })
}

const checkFileType = (path, io) => {
  if(!filesToCheckInitiated) {
    console.log('counting filesOIJFDSOIFJOSIDJFOISDJFOI')
    countFiles(path);
    filesToCheckInitiated = true;
  }

  fs.readdir(path, (err, files) => {
    // there is no way to know the end of the last file, so I loop all files once and loop again.

    for(const file of files) {
      let currentPath = `${path}/${file}`
      let fileExtension = file.split(".").pop();

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);

        if (stats.isDirectory()) {
          // this means that this is a build
          checkFileType(currentPath, io);
        } else if (stats.isFile()) {
          let fileExtension = file.split(".").pop();
          if (fileExtension === "png" || fileExtension === "jpg") {

            const buffer = readChunk.sync(currentPath, 0, 12);
            const fileType = imageType(buffer);
            const actualFileType = fileType && fileType.ext;

            console.log('currentPath: ', currentPath)
            console.log('actualFileType: ', actualFileType);
            console.log('fileExtension: ', fileExtension)
            if(actualFileType !== fileExtension) {
              console.log('MISMATCH FOUND CONFIRMED')
              typeMismatches.push({
                path: currentPath,
                extensionType: fileExtension,
                actualType: actualFileType
              })
            }

            filesChecked += 1;

            console.log('filesToCheck: ', filesToCheck);
              console.log('filesChecked: ', filesChecked)
              console.log('-------')
            if (filesChecked === filesToCheck) {

              if (io) {
                io.emit("checkFileType complete", {
                  mismatches: typeMismatches,
                  message: `Number of mismatches: ${typeMismatches.length}`
                })
              }

              console.log('typeMismatches: ', typeMismatches);

              filesToCheckInitiated = false;
              typeMismatches = []
              filesToCheck = 0;
              filesChecked = 0;

              
            }
          }
        }
      })
    }
  })
}

module.exports = checkFileType;