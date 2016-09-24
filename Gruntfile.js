var fs = require('fs'),
  path = require('path'),
  i18nTask = require('./i18n'),
  _ = require('lodash-node');

module.exports = function (grunt) {
  i18nTask(grunt);

  var getScriptsFiles = function(paths) {
    var files = grunt.file.expand({cwd: 'src'}, paths),
          filesStrArr = [];
    
    for (var i = 0; i < files.length; i++)
      filesStrArr[i] = "'/"+files[i]+"'"
    
    return filesStrArr.join(',\n');
  }

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-htmlrender');
  grunt.loadNpmTasks('grunt-fontello');


  grunt.registerTask('build', ['clean:all', 'copy:app', 'less:build', 'copy:assets', 'htmlrender:build', 'i18n:build']);
  grunt.registerTask('release', ['clean:all', 'less:release', 'uglify:app', 'copy:assets', 'htmlrender:release', 'i18n:build']);
  grunt.registerTask('watch-build', ['build', 'watch:build']);
  grunt.registerTask('watch-release', ['release', 'watch:release']);
  grunt.registerTask('fonts', ['fontello:build']);
    
  grunt.initConfig({
    timestamp: new Date().getTime(),
    watch: {
      options: {
        interval: 200,
        spawn: false
      },
      build: {
        files: ['src/*.*', 'src/i18n/*.json', 'src/app/**', 'src/css/**/*.less', 'src/css/*.less', 'src/meta/**', 'src/addon/*.js'],
        tasks: ['clean:app', 'copy:app', 'less:build', 'htmlrender:build', 'i18n:build']
      },
      release: {
        files: ['src/*.*', 'src/i18n/*.json', 'src/app/**', 'src/css/*.less', 'src/css/*.less', 'src/meta/**', 'src/addon/*.js'],
        tasks: ['clean:app', 'uglify:app', 'less:release', 'htmlrender:release']
      }
    },
    i18n: {
      build: {
        options: {
          src: ['src/i18n/*.json'],
          locales: ['pl', 'en']//, 'en']
        },
      
        files: [{
          dest: 'dist',
          src : ['*.html'],
          expand: true,
          cwd: 'temp'
        }]
      
      }
    },
    htmlrender: {
      build: {
        options: {
          src: ['src/**/*.html'],
          vars: {
            scriptsPath: 'scripts.html',
            scriptsFiles: function() { return getScriptsFiles(['app/**/*.js']) },
            stylesPath: '/css/index.css'
          }
        },
        files: [{
            expand: true,
            cwd: 'src',
            src: ['*.html'],
            dest: 'temp',
            ext: '.html'
        }]
      },
      release: {
        options: {
          src: ['src/**/*.html'],
          vars: {
            scriptsPath: 'scripts.min.html',
            stylesPath: '/app/app.<%=timestamp%>.css',
            timestamp: '<%=timestamp%>'
          }
        },
        files: [{
            expand: true,
            cwd: 'src',
            src: ['*.html'],
            dest: 'temp',
            ext: '.html'
        }]
      }
    },
    copy: {
      app: {
        files: [{ dest: 'dist', src : ['app/**/*.js'], expand: true, cwd: 'src' }]
      },
      assets: {
        files: [{ dest: 'dist', src : ['img/**', 'vendor/**', 'font/**', 'favicon.ico', 'addon/*.js'], expand: true, cwd: 'src' }]
        //files: [{ dest: 'dist', src : ['vendor/**', 'font/**'], expand: true, cwd: 'src' }]
      }
    },    
    clean: {
      all: ['dist/**', 'temp'],
      app: ['dist/app/**', 'dist/css/**']
    },
    uglify: {
      app:{
        src:['src/app/**/*.js'],
        dest:'dist/app/app.<%=timestamp%>.js'
      },
      options: {
        mangle: false
      }
    },
    less: {
      build: {
        options: {
          sourceMap: true,
          sourceMapFilename: 'dist/css/index.css.map',
          sourceMapURL: '/css/index.css.map',
          sourceMapBasepath: 'src',
          sourceMapRootpath: '/'
        },
        files: {
          'dist/css/index.css': 'src/css/index.less'
        }
      },
      release: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
          'dist/app/app.<%=timestamp%>.css': 'src/css/index.less'
        }
      }
    },
    fontello: {
              build: {
                options: {
                  config  : 'fontello.json',
                  fonts   : 'src/font',
                  styles  : 'src/css/font',
                  scss    : false,
                  force   : true
                }
              }
            }
  });

};