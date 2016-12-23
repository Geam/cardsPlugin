module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		clean: {
			deps: [
				"app/node_modules",
			],
			zip: [
				"cardsPlugin.zip",
			]
		},

		jshint: {
			options: {
				jshintrc: true,
			},
			all: ['Gruntfile.js', 'app/js/*.js'],
		},

		run: {
			appDep: {
				exec: 'cd app && npm install'
			}
		},

		compress: {
			main: {
				options: {
					archive: 'cardsPlugin.zip'
				},
				expand: true,
				cwd: 'app',
				src: ['**/*'],
				dest: './'
			}
		},
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-run');

	grunt.registerTask('build', [
		'jshint',
		'run:appDep',
		'compress',
	]);

	grunt.registerTask('mrproper', ["clean"]);

	grunt.registerTask('default', ["build"]);

};
