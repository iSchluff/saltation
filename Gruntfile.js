var path= require("path");

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    less : {
      // build custom less
      main: {
        files: {
          "dist/css/main.css": ["src/less/main.less"]
        }
      },
    },
    
    // filewatching
    watch: {
      main: {
        files: ["src/less/*.less"],
        tasks: ["less:main"],
        options: {spawn: false}
      },
    },
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-newer');

  // Default task(s).
  grunt.registerTask('build', ["newer:less"]);
  grunt.registerTask('default', ["build", "watch"]);
  
  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });
};