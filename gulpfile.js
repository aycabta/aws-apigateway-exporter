var gulp = require('gulp');
var babel = require('gulp-babel');
var rename = require('gulp-rename');
var del = require('del');

gulp.task('build', ['build-bin', 'build-lib']);

gulp.task('build-bin', function() {
    return gulp.src('src/index.js')
        .pipe(babel())
        .pipe(rename('aws-apigateway-exporter'))
        .pipe(gulp.dest('bin'));
});

gulp.task('build-lib', function() {
    return gulp.src('src/get_parameters.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('clean', function(cb) {
    del(['bin', 'lib'], cb);
});

gulp.task('run', ['build'], function() {
    require('child_process').exec('node bin/aws-apigateway-exporter', function (error, stdout, stderr) {
        console.log(stdout);
        console.error(stderr);
    });
});

