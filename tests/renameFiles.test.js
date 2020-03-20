const renameFiles = require("../modules/renameFiles.js");

const testBannerDir = __dirname.replace("/tests", "");
const fs = require("fs");

beforeAll(async (done) => {
  const data = await renameFiles(`${testBannerDir}/banners`);
  setTimeout(() => {
    done();
  },1000)
})

test("looping through path", async () => {
  const data = await fs.readdirSync(`${testBannerDir}/banners`)
  console.log('data: ', data);
  expect(data).toEqual([".DS_Store","consideration_01_300x250"])
});

test("renamed files and folders do NOT contain versions", async () => {
  const data = await fs.readdirSync(`${testBannerDir}/banners`)
  
  const regex = /_v[0-9][0-9]|_v[0-9]/g;
  let containsVersion = 0;

  for ( let i = 0; i < data.length; i++ ) {
    if (regex.test(data[i])) {
      containsVersion++
    }
  }

  expect(containsVersion).toBe(0);
})

// afterAll(async (done) => {
//   const randomVersion = Math.floor(Math.random(0, 99) * 100)
//   fs.readdir(`${testBannerDir}/banners`, (err, files) => {
//     for (const file of files) {
//       let upOnePath = `${testBannerDir}/banners`;
//       let currentPath = `${testBannerDir}/banners/${file}`;

//       fs.lstat(currentPath, (err, stats) => {
//         if (err) return console.log(err);
//         if (stats.isDirectory()) {
//           fs.rename(currentPath, `${currentPath}_v${randomVersion}`, err => {
//             if (err) throw err;
//           });
//         }
//       })
//     }
//     console.log('AFTERALL DONE')
//     done();
//   })
// })