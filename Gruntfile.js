/* global module */
module.exports = function(grunt) {
	"use strict";
	grunt.initConfig({
		pkg: grunt.file.readJSON("apexplugin.json"),
		banner: '/**\n' +
			' * Oracle APEX plugin <%= pkg.name %> helper - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
			' * Copyright (c) 2017<% parseInt(grunt.template.today("yyyy")) > 2017 ? "-" + grunt.template.today("yyyy") : "" %> <%= pkg.author.name %> - <%= pkg.license %> license\n' +
			' */\n',
		jshint: {
			files: [
				"Gruntfile.js",
				"apexplugin.json",
				"sources/plugin-dhtmlxgantt-helper.js"
			],
			options: {
				jshintrc: true
			}
		},
		copy: {
		  server: {
				src: "sources/plugin-dhtmlxgantt-helper.js",
				dest: "server/plugin-dhtmlxgantt-helper.js",
		    options: {
		      process: function (content, srcpath) {
						return grunt.template.process("<%= banner %>") + "\n" +
							content.replace(/x\.x\.x/g, grunt.template.process("<%= pkg.version %>"));
		      }
		    }
		  }
		},
		uglify: {
			options: {
				banner: "<%= banner %>"
			},
			server: {
				src: "server/plugin-dhtmlxgantt-helper.js",
				dest: "server/plugin-dhtmlxgantt-helper.min.js"
			},
		},
		watch: {
			files: [
				"Gruntfile.js",
				"apexplugin.json",
				"sources/*",
				"LICENSE.txt"
			],
			tasks: ["jshint","copy","uglify"]
		}
	});
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-notify");
	grunt.registerTask("default", ["jshint","copy","uglify"]);
};
