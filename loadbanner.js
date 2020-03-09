const currentDirectory = document.getElementById("directory").innerHTML;

var requireScript = document.createElement("script");
requireScript.src = `${currentDirectory}\\node_modules\\html2canvas\\dist\\html2canvas.js`;
document.body.appendChild(requireScript);



// if(isRetinaDisplay()) {
//   console.log('retina detected will divide picture size by half')
//   screenshot.width = Math.floor(screenshot.width / 2);
//   screenshot.height = Math.floor(screenshot.height / 2);
// }

setTimeout(() => {
  const banner = document.getElementById("outer_wrapper");
  html2canvas(document.getElementById("outer_wrapper")).then(function(canvas) {
    const adNum = document.getElementById("adNum").innerHTML;
    canvas.id = `myScreenshot_${adNum}`;
    document.body.appendChild(canvas);
  });
}, 2000);

tl.timeScale(50);

// this just checks if the whole WINDow of the app is in a retina dispaly, not the image
// so this might need to be changed so that it checks the image instead of the window in the future
// function isRetinaDisplay() {
//   if (window.matchMedia) {
//       var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
//       return (mq && mq.matches || (window.devicePixelRatio > 1)); 
//   }
// }

// requirejs(
//   [`${currentDirectory}\\node_modules\\html2canvas\\dist\\html2canvas.js`],
//   function(html2canvas) {
//     setTimeout(() => {
//       html2canvas(document.getElementById("outer_wrapper")).then(function(
//         canvas
//       ) {
//         const adNum = document.getElementById("adNum").innerHTML;
//         console.log("apprending canvas");
//         canvas.id = `myScreenshot_${adNum}`;
//         document.body.appendChild(canvas);
//       });
//     }, 2000);
//   }
// );
