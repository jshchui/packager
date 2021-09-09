let operatingSystem = "Unknown OS";
if (navigator.userAgent.indexOf("Win") != -1) operatingSystem = "Windows OS";
if (navigator.userAgent.indexOf("Mac") != -1) operatingSystem = "Macintosh";
if (navigator.userAgent.indexOf("Linux") != -1) operatingSystem = "Linux OS";
if (navigator.userAgent.indexOf("Android") != -1) operatingSystem = "Android OS";
if (navigator.userAgent.indexOf("like Mac") != -1) operatingSystem = "iOS";

const currentDirectory = document.getElementById("directory").innerHTML;
var requireScript = document.createElement("script");

// html2canvas was not working on windows because windows uses '\' and mac uses '/'
const currentDirectoryToArray = currentDirectory.split(operatingSystem === 'Windows OS' ? '\\' : '/')
currentDirectoryToArray.pop();

const rootDirectory = currentDirectoryToArray.join('/')

requireScript.src = `${rootDirectory}\\node_modules\\html2canvas\\dist\\html2canvas.js`;
document.body.appendChild(requireScript);

// container dc only exists in DCS, so if exists, then use that, if not its dcm so use background container dc
// const banner = document.getElementById("container_dc") ? document.getElementById("container_dc") : document.getElementById("background_exit_dc");
let banner;

if(document.getElementById("container_dc")) { // DCS
  banner = document.getElementById("container_dc")

} else if (document.getElementById("background_exit_dc")) { // DCM
  banner = document.getElementById("background_exit_dc")

} else if (document.getElementById("adf-banner")) { // ADFORM 
  banner = document.getElementById("adf-banner") 

} else if (document.getElementById("container")) { // Flash talking 
  banner = document.getElementById("container") 

} else if (document.getElementById("banner")) { // Sizmek? 
  banner = document.getElementById("banner") 
}
  


if (isRetinaDisplay()) {
  banner.style.transform = "scale(0.5)";
}

const fastForwardBanner = setInterval(() => {
  if (tl) {
    clearInterval(fastForwardBanner);
    tl.timeScale(5);
  }
}, 1000)

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
