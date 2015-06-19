/*!
 * knockout-example
 *
 */

'use strict';

/**
 * Livereload and connect variables, these are just Glogal JS variables
 */
var LIVERELOAD_PORT = 35729;

/**
 * This is the location of the stubby config file. It can be in json format or yaml (python) .
 * see here for more details on how to configure it:
 * https://github.com/mrak/stubby4node
 * https://github.com/h2non/grunt-stubby
 */
var STUBBY_CONFIG = 'stubs/config/stubby.json'; // or stubby.yaml if you prefer

/*var mountFolder = function (connect, dir) {
	return connect.static(require('path').resolve(dir));
};*/

/**
 * Grunt module
 */
module.exports = function (grunt) {

	/**
	 * Dynamically load npm tasks
	 */
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	/**
	 * EvalueWidgets Grunt config
	 */
	grunt.initConfig({

		/**
		 * Loads all the npm tasks defined in package.json
		 */
		pkg: grunt.file.readJSON('package.json'),

		/**
		 * Set project info, this is just our own structure so that we can refer to these
		 * values later on like this <%= project.src %>.
		 */
		project: {
			src: 'src',
			dist: 'dist',
			js: '<%= project.src %>/js/**/*.js',
			css: '<%= project.src %>/css/**/*.css',
			includes: '<%= project.src %>/includes',
			components: '<%= project.src %>/components'
		},


		/**
		 * Connect port/livereload
		 * https://github.com/gruntjs/grunt-contrib-connect
		 * Starts a local webserver and injects
		 * livereload snippet
		 */
		connect: {
			options: {
				port: 9000,
				hostname: '*'
			},
			livereload: {
				options: {
					middleware: function (connect) {
						// hockup the connect task with the stubby task through grunt-connect-proxy
						var middlewares = [];
						var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;
						var lrSnippet = require('connect-livereload')({
							port: LIVERELOAD_PORT
						});

						middlewares.push(proxySnippet);
						middlewares.push(lrSnippet);
						middlewares.push(connect.static(require('path').resolve('dist')));
						return middlewares; //[lrSnippet, mountFolder(connect, 'app')];
					}
				}
			},
			/**
			 * Grunt connect proxy, proxies requests from the grunt connect server to any other servers
			 * https://github.com/drewzboto/grunt-connect-proxy
			 */
			proxies: [{
				context: '/data',
				host: 'localhost',
				port: 8882,
				https: false,
				changeOrigin: false,
				xforward: false
			}]
		},
		/**
		 * The stubby server provides json stubs for Ajax requests
		 * https://www.npmjs.com/package/grunt-stubby
		 *
		 */
		stubby: {
			stubsServer: {
				options: {
					mute: false,
					watch: STUBBY_CONFIG
				},
				// note the array collection instead of an object 
				files: [{
					src: [STUBBY_CONFIG]
				}]
			}
		},

		/**
		 * JSHint
		 * https://github.com/gruntjs/grunt-contrib-jshint
		 * Manage the options inside .jshintrc file
		 */
		jshint: {
			files: [
				'<%= project.js %>',
				'Gruntfile.js'
			],
			options: {
				jshintrc: '.jshintrc',
				//Set force to true to report JSHint errors but not fail the task.
				force: true
			}
		},

		/**
		 * Concatenate JavaScript files
		 * https://github.com/gruntjs/grunt-contrib-concat
		 * Imports all .js files and appends project banner
		 */
		concat: {
			dev: {
				files: {
					'<%= project.dist %>/js/app.js': [
						'<%= project.js %>'
					]
				}
			},
			options: {
				stripBanners: false,
				nonull: true,
				sourceMap: true
			}
		},

		/**
		 * CSSMin
		 * CSS minification
		 * https://github.com/gruntjs/grunt-contrib-cssmin
		 */
		cssmin: {
			dev: {
				files: {
					'<%= project.dist %>/css/app.css': [
						'<%= project.css %>'
					]
				}
			},
			options: {
				sourceMap: true
			}
		},

		/**
		 * The Grunt includereplace task allows us to have imports in HTML files similar to JSPs,
		 * simply include @@include('filename') in your HTML and it does the import
		 * https://github.com/alanshaw/grunt-include-replace
		 */
		includereplace: {
			dev: {
				options: {
					// Task-specific options go here. This the base directory where we want to include files from
					includesDir: '<%= project.includes %>/'
				},
				files: [{
					src: '<%= project.src %>/index.html',
					dest: '<%= project.dist %>/index.html'
				}, {
					src: '<%= project.src %>/templates/serviceCredits.html',
					dest: '<%= project.dist %>/templates/serviceCredits.html'
				}]
			}
		},

		/**
		 * Build bower components
		 * https://github.com/yatskevich/grunt-bower-task
		 */
		bower: {
			dev: {
				dest: '<%= project.dist %>/components/'
			}
		},

		/**
		 * Opens the web server in the browser
		 * https://github.com/jsoverson/grunt-open
		 */
		open: {
			server: {
				path: 'http://localhost:<%= connect.options.port %>'
			}
		},


		/**
		 * Runs tasks against changed watched files
		 * https://github.com/gruntjs/grunt-contrib-watch
		 * Watching development files and run concat/compile tasks
		 * Livereload the browser once complete
		 */
		watch: {
			// watch the widgets CCS
			css: {
				files: '<%= project.css %>',
				tasks: ['cssmin:dev']
			},
			js: {
				files: [
					'<%= project.js %>'
				],
				tasks: ['concat:dev']
			},
			html: {
				files: [
					'<%= project.src %>/*.html'
				],
				tasks: ['includereplace:dev'],
			},
			livereload: {
				options: {
					livereload: LIVERELOAD_PORT
				},
				files: [
					'<%= project.dist %>/{,*/}*.html',
					'<%= project.dist %>/css/*.css',
					'<%= project.dist %>/js/{,*/}*.js',
					'<%= project.dist %>/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
				]
			}
		}
	});

	/**
	 * Default task
	 * Run `grunt` on the command line
	 */
	grunt.registerTask('default', [
		'bower:dev',
		'cssmin:dev',
		'jshint',
		'concat:dev',
		'includereplace:dev',
		'stubby',
		'configureProxies:server',
		'connect:livereload',
		'open',
		'watch'
	]);

};