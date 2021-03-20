module.exports = function (grunt) {
	'use strict';

	grunt.initConfig({
		yaml_validator: require("./grunt_tasks/yaml_validator.js")(grunt),
		mochaTest:      require("./grunt_tasks/mocha_test.js"),
		jsonlint:       require("./grunt_tasks/json_lint.js"),
		jshint:         require("./grunt_tasks/jshint.js"),
		files:          require("./grunt_tasks/files.js"),
		watch:          require("./grunt_tasks/watch.js"),
		pkg:            require('./package.json')
	});

	// loads all modules with grunt-*   this is more concise than individually loading them
	// ex
	// grunt.loadNpmTasks("grunt-contrib-jshint").. etc
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	grunt.registerTask('test',     ['force:mochaTest']);

	grunt.registerTask('default',  [
		"force:yaml_validator", "force:jsonlint", "force:jshint:src_and_test", "force:mochaTest", "watch"
	]);

	grunt.registerTask('lint',     ['force:jshint', "watch:src"]);
	grunt.registerTask('testlint', ['force:mochaTest',"force:jshint", "watch"]);
};

