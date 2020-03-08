// import html2canvas from "./node_modules/html2canvas/dist/html2canvas.js";
// import { html2canvas } from './node_modules/html2canvas/dist/html2canvas.js';
// import html2canvas from '.node_modules/html2canvas';

const currentDirectory = document.getElementById("directory").innerHTML;

var requireScript = document.createElement("script");
requireScript.src = `${currentDirectory}\\node_modules\\html2canvas\\dist\\html2canvas.js`;
document.body.appendChild(requireScript);

setTimeout(() => {
  html2canvas(document.getElementById("outer_wrapper")).then(function(canvas) {
    const adNum = document.getElementById("adNum").innerHTML;
    console.log("apprending canvas");
    canvas.id = `myScreenshot_${adNum}`;
    document.body.appendChild(canvas);
  });
}, 2000);

tl.timeScale(50);

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
