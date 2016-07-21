'use strict';

module.exports = function(grunt) {

  var fs = require('fs'),
      path = require('path'),
      _ = require('lodash-node'),
      i18nRegExp = new RegExp("_\\(([^\\)]+)\\)", "gim");

  grunt.registerMultiTask('i18n', 'Translates files', function() {

    var options = this.options({
      src: 'src/i18n/*.json',
      locales: ['pl']    
    });
    
    var locales = {};
    options.locales.forEach(function(lang) {
      locales[lang] = {};
    });
    
    var render = function(html, lang) {
		console.log('I18N');
      return html.replace(i18nRegExp, function(all, code) {
        var translation = locales[lang][code];
        
        if (!translation) {
          grunt.log.warn("Missing translation " + lang + " -> " + code);
        }
        return translation || code;
      });   
    };

    grunt.file.expand(options.src).forEach(function(file) {
      var lang = path.extname(path.basename(file, '.json')).substring(1),
          buffer = fs.readFileSync(file);
      
      if (buffer.length) {
        grunt.log.ok(file + ' was successfuly loaded');
        _.merge(locales[lang], JSON.parse(buffer));
      }
    });

    this.files.forEach(function(f) {
      if (f.src.length > 1) {
        grunt.fail.fatal('Only one file can be translated, ' + f.orig.src + ' found.');
      }

      if (f.src.length === 0) {
        grunt.fail.fatal(f.orig.src + ' not found!');
      }

      var fileToRender = path.normalize(f.src[0]),
          content = fs.readFileSync(fileToRender);

      _.each(options.locales, function(lang) {
        var ext = path.extname(f.dest),
            basename = path.basename(f.dest, ext),
            dirname = path.dirname(f.dest),
            outFile = path.join(dirname, basename + '.' + lang + ext);

        grunt.file.write(outFile, render(content.toString(), lang));
        grunt.log.ok(outFile + ' was successfuly rendered.');
      });      
    });
  });
};
