var fs = require("fs");
const minify = require("@node-minify/core");
const uglifyjs = require("@node-minify/uglify-js");
const cssnano = require("@node-minify/cssnano");

const minifyFiles = async (path) => {
  try {
    const filesToMinify = await findMinifyableFiles(path)
    // console.log('files to minify: ', filesToMinify)
    const minifiedFiles = []

    let fileExtension
    let filePath
    let minified

    for(const fileInfo of filesToMinify) {
      fileExtension = fileInfo[0]
      filePath = fileInfo[1]
      if(fileExtension === 'js') {
        minified = await doMinify(filePath, uglifyjs)
      } else {
        minified = await doMinify(filePath, cssnano)
      }

      minifiedFiles.push(filePath)
    }

    return minifiedFiles
  } catch (err) {
    console.log('err: ', err)
  }
}

const findMinifyableFiles = async (path) => {
  let filesToMinify = []

  const files = await fs.readdirSync(path)

  for (const file of files) {
    const currentPath = `${path}/${file}`
    const fileExtension = file.split(".").pop()
    const fileStats = fs.lstatSync(currentPath)
  
    if ( fileStats.isDirectory() ) {
      filesToMinify.push(...await findMinifyableFiles(currentPath))
    } else if (fileExtension === "js" || fileExtension === "css") {
      filesToMinify.push([fileExtension, currentPath])
    }
  }

  return filesToMinify
}


async function doMinify(currentPath, compressor) {
  const min = await minify({
    compressor: compressor,
    input: `${currentPath}`,
    output: `${currentPath}`
  })
  
  return min;
}


module.exports = minifyFiles;
