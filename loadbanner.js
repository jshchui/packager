// import html2canvas from './node_modules/html2canvas/dist/html2canvas.js';
// import { html2canvas } from './node_modules/html2canvas/dist/html2canvas.js';
// import html2canvas from '.node_modules/html2canvas';
// const html2canvas = require('html2canvas');

console.log("loading banner");

// requirejs(["./node_modules/html2canvas/dist/html2canvas.js"], function(

console.log("requireJS: ", requirejs);

requirejs(
  [
    "C:\\Users\\Jack\\Desktop\\Packagers\\V6dTransfer\\node_modules\\html2canvas\\dist\\html2canvas.js"
  ],
  function(html2canvas) {
    setTimeout(() => {
      html2canvas(document.getElementById("outer_wrapper")).then(function(
        canvas
      ) {
        const adNum = document.getElementById("adNum").innerHTML;
        console.log("apprending canvas");
        canvas.id = `myScreenshot_${adNum}`;
        document.body.appendChild(canvas);
      });
    }, 10000);
  }
);
