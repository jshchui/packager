const currentDirectory = document.getElementById("directory").innerHTML;

var requireScript = document.createElement("script");
requireScript.src = `${currentDirectory}\\node_modules\\html2canvas\\dist\\html2canvas.js`;
document.body.appendChild(requireScript);

const banner = document.getElementById("background_exit_dc");
if (isRetinaDisplay()) {
  banner.style.transform = "scale(0.5)";
}

tl.timeScale(5);
// tl.seek(40).pause();

const checkBannerComplete = setInterval(() => {
  if (!tl.isActive()) {
    html2canvas(banner).then(function(canvas) {
      canvas.id = `myScreenshot`;
      document.body.appendChild(canvas);
      document.body.insertAdjacentHTML(
        "beforeend",
        `<span id="bannerFinished"></span>`
      );
      clearInterval(checkBannerComplete);
    });
  }
}, 1000);

// this just checks if the whole WINDow of the app is in a retina dispaly, not the image
// so this might need to be changed so that it checks the image instead of the window in the future
function isRetinaDisplay() {
  if (window.matchMedia) {
    var mq = window.matchMedia(
      "only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)"
    );
    return (mq && mq.matches) || window.devicePixelRatio > 1;
  }
}
