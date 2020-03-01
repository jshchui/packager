module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');

    const os = require('os');
    require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks



    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // define source files and their destinations
        cssmin: {
            t1 : {
                files: [{
                    cwd: 'banners/',
                    // src: ['*.css', '!*.min.css'],
                    src: '**/*.css',
                    dest: 'banners/',
                    expand: true,
                    ext: '.css',
                    // ext: '.min.css',
                }]
            },
        },
        uglify: {
            t2: {
                files: [{
                    cwd: 'banners/',
                    src: '**/*.js',
                    dest: 'banners/',
                    expand: true,
                    flatten: false,
                    ext: '.js'
                    // ext: '.min.js'
                }]
            }
        },
        watch: {
            js:  { files: 'js/*.js', tasks: [ 'uglify' ] },
        },
        electron: {
            macosBuild: {
                options: {
                    name: 'Fixture',
                    dir: 'app',
                    out: 'dist',
                    version: '1.3.5',
                    platform: 'darwin',
                    arch: 'x64'
                }
            }
        },
        'electron-packager': {
            options: {
              asar: true,
              dir: './app',
              icon: './app/recursos/icon',
              ignore: 'bower.json',
              out: './build',
              overwrite: true
            },
            build: {
              name: 'nameBuild-test',
              arch: os.arch(),
              platform: os.platform(),
              // set specific version of electron, If it isn't using the electron's version on your deps.
              electronVersion: '1.8.4',
            },
            buildLinux: {
              name: 'nameBuild-test-linux',
              arch: 'x64',
              platform: 'linux',
            },
            buildWin: {
              name: 'nameBuild-test-win',
              arch: 'x64',
              platform: 'win32',
            },
          }
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-watch');

    // register at least this one task
    // grunt.registerTask('default', [ 'electron-packager' ]);
    grunt.registerTask('build', [ 'electron-packager' ]);
    // grunt.registerTask('default', [ 'uglify', 'electron' ]);
};