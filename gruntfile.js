module.exports = function(grunt) {
  grunt.initConfig({
  less: {
    development: {
      options: {
        paths: ["./www/less"],
        yuicompress: true
      },
      files: {
        "./www/css/application.css": "./www/less/application.less"
      }
    } // development
  }, // less
  watch: {
    scripts: {
      files: ['./www/js/**/*.js'],
      tasks: ['clean:js','copy:js']
    }, //scripts
    less: {
      files: ['./www/less/*'],
      tasks: ['less','copy:css']
    }, //less
    html: {
      files: ['./www/index.html'],
      tasks: ['copy:html']
    } //html
  }, // watch
  clean: {
    js: './platforms/ios/www/js/'
  },
  copy: {
    css: {
      src: './www/css/application.css',
      dest: './platforms/ios/www/css/application.css',
      filter: 'isFile'
    }, //css
    js: {
      expand: true,
      cwd: './www/js/',
      src: '*',
      dest: './platforms/ios/www/js/'
    }, //js
    html: {
      src: './www/index.html',
      dest: './platforms/ios/www/index.html',
      filter: 'isFile'
    } //html
  } //copy
  });
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
};