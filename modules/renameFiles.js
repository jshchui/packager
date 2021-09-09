var fs = require("fs");

const renameFiles = async (path) => {
  // regex to detect versions, from v0 - v99
  let versionRegex = new RegExp(/_v[0-9][0-9]|_v[0-9]/)

  try {
    const bannersToRename = await findRenamableBanners(path)
    const bannersBeforeAndAfter = []
    console.log('bannersToRename: ', bannersToRename)

    let bannerName
    let bannerPath
    let upOnePath
    let newBannerName
    for(const bannerInfo of bannersToRename) {
      bannerName = bannerInfo[0]
      bannerPath = bannerInfo[1]
  
      // upOnePath = bannerPath.split('/').shift()
      upOnePath = bannerPath.split('/').slice(0,-1).join('/')
      newBannerName = bannerName.replace(versionRegex, "")

      console.log('renamingpath: ', `${upOnePath}/${newBannerName}`)
  
      fs.renameSync(bannerPath, `${upOnePath}/${newBannerName}`)
      bannersBeforeAndAfter.push({
        "bannerNameBefore": bannerName,
        "bannerNameAfter": newBannerName
      })
    }
    return bannersBeforeAndAfter
  } catch (err) {
    console.log('err: ', err)
  }

}

// returns an array of array [file, path] of all folders with _v in the path
const findRenamableBanners = async (path) => {
  let versionRegex = new RegExp(/_v[0-9][0-9]|_v[0-9]/)

  // this will be renamed to something else
  let filesToRename = []

  const files = await fs.readdirSync(path)

  for (const file of files) {
    let currentPath = `${path}/${file}`
    // let fileExtension = file.split(".").pop()

    const fileStats = fs.lstatSync(currentPath)

    if ( fileStats.isDirectory() ) {
      if(versionRegex.test(file.toString())) {
        filesToRename.push([file, currentPath])
      } else {
        filesToRename.push(...await findRenamableBanners(currentPath))
      }
    } 
  }

  return filesToRename
}


module.exports = renameFiles;
