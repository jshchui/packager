var fs = require("fs");

const renameFiles = (path, io) => {
  let regex = /_v[0-9][0-9]|_v[0-9]/g;
  let foldersAndFilesToRename = 0;
  let foldersRenamed = 0;
  let filesRenamed = 0;
  
  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let upOnePath = `${path}`;
      let currentPath = `${path}/${file}`;

      fs.lstat(currentPath, (err, stats) => {
        if (err) return console.log(err);

        if (stats.isDirectory()) {
          if (regex.test(file)) {
            foldersAndFilesToRename++;
            // console.log(
            //   "Detected Folder that needs renaming, foldersAndFilesToRename: ",
            //   foldersAndFilesToRename
            // );

            let currentFileName = file;
            let newFileName = currentFileName.replace(regex, "");
            fs.rename(currentPath, `${upOnePath}/${newFileName}`, err => {
              if (err) throw err;
              foldersRenamed++;
              foldersAndFilesToRename--;
              // console.log(
              //   "file renamed, foldersAndFilesToRename: ",
              //   foldersAndFilesToRename
              // );
              // console.log(`"${file}" changed to "${newFileName}"`);

              if (foldersAndFilesToRename === 0) {
                if(io) {
                  io.emit(
                    "rename complete",
                    `Renaming Completed! Folders Renamed: ${foldersRenamed}, Files Renamed: ${filesRenamed}`
                  );
                }
                foldersAndFilesToRename = 0;
                foldersRenamed = 0;
                filesRenamed = 0;
              }
            });
          } else {
            renameFiles(currentPath, io);
          }
        } else if (stats.isFile()) {
          if (regex.test(file)) {
            foldersAndFilesToRename++;
            // console.log(
            //   "Detected File that needs renaming, foldersAndFilesToRename: ",
            //   foldersAndFilesToRename
            // );

            let currentFileName = file;
            let newFileName = currentFileName.replace(regex, "");
            fs.rename(currentPath, `${upOnePath}/${newFileName}`, err => {
              if (err) throw err;
              filesRenamed++;
              foldersAndFilesToRename--;
              // console.log(
              //   "file renamed, foldersAndFilesToRename: ",
              //   foldersAndFilesToRename
              // );
              // console.log(`"${file}" changed to "${newFileName}"`);

              if (foldersAndFilesToRename === 0) {
                if(io) {
                  io.emit(
                    "rename complete",
                    `Renaming Completed! Folders Renamed: ${foldersRenamed}, Files Renamed: ${filesRenamed}`
                  );
                }
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

  return "renameFiles was called";

  // console.log('I should be after most if not ALL of stuff')
  // return `Folders Renamed: ${foldersRenamed}, Files Renamed: ${filesRenamed}, Notes: ${(foldersAndFilesToRename === 0) ? 'Process Successful' : `Error occured, files and folders to rename is ${foldersAndFilesToRename} instead of 0`}`
};

module.exports = renameFiles;
