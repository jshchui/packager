// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  console.log('on preload')
  
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  // var npm = require("npm");
  // npm.load({
  //     loaded: false
  // }, function (err) {
  //   // catch errors
  //   npm.commands.install([
  //     "grunt@1.04",
  //     "grunt-contrib-cssmin@3.0.0",
  //     "grunt-contrib-uglify@4.0.1",
  //     "grunt-contrib-uglify-es@3.3.0",
  //     "grunt-contrib-watch@1.1.0"
  // ], function (er, data) {
  //     // log the error or data
  //     if(er) console.log('er: ', er);
  //     if(data) console.log('data: ', data);
  //   });
  //   npm.on("log", function (message) {
  //     // log the progress of the installation
  //     console.log('log: ',message);
  //   });
  // });
})
