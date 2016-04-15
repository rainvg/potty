/* File: gulpfile.js */

var gulp  = require('gulp'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    replace = require('gulp-replace'),
    mocha = require('gulp-mocha'), // jshint ignore: line
    rename = require('gulp-rename');

gulp.task('default', ['lint','test', 'minify'], function()
{
});

gulp.task('lint', function()
{
  return gulp.src('./src/*.js').pipe(jshint()).pipe(jshint.reporter('jshint-stylish')).pipe(jshint.reporter('fail'));
});

gulp.task('minify', ['lint', 'test'], function()
{
  return gulp.src(['src/index.js', 'src/app.js', 'src/pot.js'])
  .pipe(replace('app.js', 'app.min.js')).pipe(replace('pot.js', 'pot.min.js'))
  .pipe(uglify()).pipe(rename({suffix: '.min'})).pipe(gulp.dest('dist'));
});

gulp.task('test', ['lint'], function()
{
  return gulp.src('test/index.js', {read: false}).pipe(mocha()).once('error', function()
  {
    process.exit(1);
  });
});
