const fs = require("fs");

// let buildsAmountTotal = 0;

async function findUnusedImages(path, io) {

    let validateImageData = [];
    const files = fs.readdirSync(path);

    for (const file of files) {
        let currentPath = `${path}/${file}`;
        let fileExtension = file.split(".").pop();

        const fileStats = fs.lstatSync(currentPath);

        if(fileStats.isDirectory()) {
            validateImageData.push(...await findUnusedImages(currentPath, io));
        } else if (
            fileExtension === "html"
        ) {
            // buildsAmountTotal+=1;
            const splitPathArray = currentPath && currentPath.split("/");
            const specificBuildPath = splitPathArray.slice(0, splitPathArray.length - 1).join('/')
                        
            const buildImages = await getImagesFromBuild(specificBuildPath);
            const cssFiles = await getCSSFiles(specificBuildPath, specificBuildPath);

            const unusedImagesArray = await checkImageWithIndexAndCSS(currentPath, buildImages, cssFiles)
            if(unusedImagesArray.length > 0) {
                validateImageData.push({
                    buildPath: specificBuildPath,
                    unusedImagesArray,
                })
            }
        }
    }

    return validateImageData;
}

async function getImagesFromBuild(currentPath) {
    const specificBuildImagePath = currentPath + '/images';

    // set up key for queue object
    const buildImagesArray = []
    const imageFilesInBuild = await fs.readdirSync(specificBuildImagePath)

    for (const file of imageFilesInBuild) {
        const imageFilePath = `${specificBuildImagePath}/${file}`
        const imageFileExtension = imageFilePath.split('.').pop();
        if(
            imageFileExtension === 'jpg' ||
            imageFileExtension === 'png' ||
            imageFileExtension === 'jpeg'
        ) {
            buildImagesArray.push(imageFilePath)
        }
    }

    return buildImagesArray;
}

async function getCSSFiles(currentPath, originalPath) {
    let cssFiles = []

    const cssInBuild = await fs.readdirSync(currentPath);
    for (const file of cssInBuild) {
        const currentFilePath = `${currentPath}/${file}`
        const currentFileExtension = currentFilePath.split('.').pop();

        const fileStats = fs.lstatSync(currentFilePath);
        if(currentFileExtension === "css") {
            cssFiles.push(currentFilePath)
        } else if(fileStats.isDirectory()) {
            const returnedCSSFiles = await getCSSFiles(currentFilePath, originalPath)
            cssFiles = [...cssFiles, ...returnedCSSFiles]
        }
    }

    return cssFiles
}

const checkImageWithIndexAndCSS = async (indexPath, imagesArray, cssFiles) => {

    const indexUnFilteredFileData = fs.readFileSync(indexPath, "utf8");
    const indexCommentRegex = /<!--(.*?)-->/g; // this regex removes comments
    const indexFileData = indexUnFilteredFileData.replace(indexCommentRegex, "")
    const indexValidatedImages = [];
    const indexUnusedImages = [];

    const imageNames = imagesArray.map(image => {
        const imageName = image.split('/').pop();

        if(indexFileData.includes(imageName)) {
            indexValidatedImages.push(image)
        } else {
            indexUnusedImages.push(image)
        }
    })


    const cssValidatedImages = [];
    const unusedImages = [];

    // if there are unused images in the index files, then check the css files.
    if(indexUnusedImages.length) {
        let cssCommentRegex = /\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/g;
        let allCSSFileData = ""
        for(file of cssFiles) {
            const cssFileData = fs.readFileSync(file, "utf-8")
            allCSSFileData+=cssFileData;
        }

        const allCSSFileDataFiltered = allCSSFileData.replace(cssCommentRegex, "")

        const imageNames = indexUnusedImages.map(image => {
            const imageName = image.split('/').pop();

            if(allCSSFileDataFiltered.includes(imageName)) {
                cssValidatedImages.push(image)
            } else {
                unusedImages.push(image)
            }
        })
    }
    return unusedImages;
}

module.exports = findUnusedImages;