// import html2canvas from './node_modules/html2canvas/dist/html2canvas.js';
// import { html2canvas } from './node_modules/html2canvas/dist/html2canvas.js';
// import html2canvas from '.node_modules/html2canvas';
// const html2canvas = require('html2canvas');

console.log("loading banner");
alert("js is running");

// requirejs(["./node_modules/html2canvas/dist/html2canvas.js"], function(
requirejs(
  [
    "C:\\Users\\Jack\\Desktop\\Packagers\\V6dTransfer\\node_modules\\html2canvas\\dist\\html2canvas.js"
  ],
  function(html2canvas) {
    setTimeout(() => {
      html2canvas(document.body).then(function(canvas) {
        console.log("apprending canvas");
        document.body.appendChild(canvas);
      });
    }, 2000);
  }
);
