
const fs = require("fs")
const minifyFiles = require("../modules/minifyFiles.js")


const testBannerDir = __dirname.replace("/tests", "");

// test("looping through path", async () => {
//   const data = await fs.readdirSync(`${testBannerDir}/banners`)
//   console.log('data: ', data);
//   expect(data).toEqual([".DS_Store",`consideration_01_300x250_v23`])
// });
test("minifyFiles was ran", async () => {
  expect.assertions(1)
  try {
    const data = await minifyFiles(`${testBannerDir}/banners`)
    expect(data).toBe("minifyFiles was called");
  } catch(err) {
    console.log(err); // TypeError: failed to fetch
  }
})