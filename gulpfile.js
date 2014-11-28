'use strict';

var gulp = require('gulp'),
	cssmin = require('gulp-cssmin'),
	less = require('gulp-less'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename');

gulp.task('less', function () {
	gulp.src('src/suaip.less')
		.pipe(less())
		.pipe(cssmin())
		.pipe(rename('suaip.min.css'))
		.pipe(gulp.dest('dist'));
});

gulp.task('js', function () {
	gulp.src('src/suaip.js')
		.pipe(uglify())
		.pipe(rename('suaip.min.js'))
		.pipe(gulp.dest('dist'));
});

gulp.task('less_watch', function () {
	gulp.watch('src/suaip.less', ['less']);
});

gulp.task('js_watch', function () {
	gulp.watch('src/suaip.js', ['js']);
});

gulp.task('default', ['less', 'js']);

gulp.task('watch', ['less', 'js', 'less_watch', 'js_watch']);
