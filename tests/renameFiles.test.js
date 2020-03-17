const { sum } = require("./sum.js");
const renameFiles = require("../modules/renameFiles.js");

test("sum", () => {
  expect(sum(1, 2)).toBe(3);
});

console.log("dirname: ", __dirname);
const testBannerDir = __dirname.replace("\\test", "");
console.log(`${testBannerDir}\\banners`);

const fs = require("fs");
// prettier-ignore
test("looping through path", async () => {
  const data = await fs.readdir(__dirname, async (err, files) => {
    await console.log('files: ', files)
    return files;
  })
  const spy = jest.spyOn(console, "log");

  expect(console.log).toBe("helo")
});

// test("rename files", () => {
//   expect(renameFiles(`${testBannerDir}/banners`)).toBe(
//     "renameFiles was called"
//   );
// });

// test("rename files", done => {
//   function callback() {
//     try {
//       expect(renameFiles(`${testBannerDir}/banners`)).toBe(
//         "renameFiles was called"
//       );
//       done();
//     } catch (error) {
//       done(error);
//     }
//   }

//   fetchData(callback);
// });
