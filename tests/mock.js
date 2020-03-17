var fs = require("fs");

const testBannerDir = __dirname.replace("\\test", "");
console.log(`${testBannerDir}\\banners`);

const data = fs.readdir(__dirname, async (err, files) => {
  await console.log("files: ", files);
  return "?";
});

console.log("data: ", data);

if (!fs.existsSync("./testFolder")) {
  console.log("Folder not found");
} else {
  console.log("Folder Found");
}
