const fs = require("fs");
const { downloadAsJPG } = require("./encoder.js");


function openIndex(path, pathToBanners) {
  fs.readdir(path, (err, files) => {
    for (const file of files) {
      let currentPath = `${path}/${file}`;
      let fileExtension = file.split(".").pop();

      fs.lstat(currentPath, (err, stats) => {
        if (stats.isDirectory()) {
          openIndex(currentPath, pathToBanners);
        } else if (fileExtension === "html") {
          console.log(`html file: ${file}, path: ${currentPath}`);


          // this opens new window
          newWindow(currentPath, pathToBanners);
        }
      });
    }
  });
}

function newWindow(path, pathToBanners) {
  var win = window.open(path, "_blank", "nodeIntegration=true");

  var script = document.createElement("script");
  script.src = `${__dirname}\\loadbanner.js`;
  script.type = "module";

  win.onload = function() {
    try {
      console.log("try");
      win.document.body.appendChild(script);
    } catch (e) {
      console.log("catch e: ", e);
      win.document.body.appendChild(script);
    }

    // we add a adNum data here so we can use it when we open the ads invidually
    win.document.body.insertAdjacentHTML(
      "beforeend",
      `<span id="directory">${__dirname}</span>`
    );

    const imagesInBanner = [...win.document.getElementsByTagName("img")];
    const imagesBannerSource = [];

    for (let i = 0; i < imagesInBanner.length; i++) {
      imagesBannerSource.push(imagesInBanner[i].src);
      imagesInBanner[i].setAttribute("src", imagesInBanner[i].src);
    }

    const checkBannerComplete = setInterval(() => {
      const isBannerFinishedSpan = win.document.getElementById(
        "bannerFinished"
      );
      if (isBannerFinishedSpan) {
        clearInterval(checkBannerComplete);
        takeScreenshot(win, path, pathToBanners);
      }
    }, 2000);
  };
}

function takeScreenshot(win, path, pathToBanners) {
  console.log("taking screenshot:", win);
  const screenshot = win.document.getElementById(`myScreenshot`);
  console.log("screenshot: ", screenshot);
  const screenshotGetContext = screenshot.getContext("2d");
  let quality = 100;
  if (screenshot) {
    var img = new Image();
    img.src = screenshot.toDataURL("image/jpg");

    var imageData = img.src.replace(/^data:image\/(png|jpg);base64,/, "");
    let newImg = downloadAsJPG(
      screenshotGetContext,
      quality,
      screenshot.width,
      screenshot.height,
      "black"
    );
    // console.log("quality before: ", quality);

    while (newImg.blob.size > 40000 && quality > 10) {
      // console.log("blob size exceeded: ", newImg.blob.size);
      if (newImg.blob.size > 50000) {
        quality -= 5;
      } else {
        quality -= 2;
      }
      newImg = downloadAsJPG(
        screenshotGetContext,
        quality,
        screenshot.width,
        screenshot.height,
        "black"
      );
    }

    console.log("quality: ", quality);

    const splitPathArray = path && path.split("/");
    const splitPathName = splitPathArray[splitPathArray.length - 2];

    // convert blob back to base64data
    var reader = new FileReader();
    reader.readAsDataURL(newImg.blob);
    reader.onloadend = function() {
      var base64data = reader.result;
      var baseData = base64data.replace(/^data:image\/(png|jpeg);base64,/, "");
      fs.writeFile(
        `${pathToBanners}/00_backups/${splitPathName}_backup.jpg`, // it was `./backups/image_${adNumber}.jpg`, before
        baseData,
        "base64",
        function(err) {
          console.log("err: ", err);
        }
      );
    };
    win.close();
  } else {
    console.log("no screenshot exists");
  }
}

module.exports = openIndex;