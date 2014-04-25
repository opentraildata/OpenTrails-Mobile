module.exports = function(grunt) {
    grunt.initConfig({
        less: {
            development: {
                options: {
                    paths: ["./www/less"],
                    yuicompress: true
                },
                files: {
                    "./www/css/application.css": "./www/less/application.less",
                    "./platforms/ios/www/css/application.css": "./www/less/application.less"
                }
            }
        },
        watch: {
            files: "./www/less/*",
            tasks: ["less"]
        }
    });
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
};