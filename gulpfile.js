
// Require

var gulp       = require('gulp'),
    fs         = require('fs'),
    browserify = require('browserify'),
    connect    = require('gulp-connect'),
    source     = require('vinyl-source-stream');


// Helpers

function reload (files) {
  gulp.src(files.path).pipe(connect.reload());
}

function handle (error) {
  console.log(error);
  this.emit('end');
}


// Preconfigure bundler

var bundler = browserify({
  debug: true,
  cache: {},
  packageCache: {},
  entries: [ './src/index.js' ],
  extensions: '.ls'
});

var distributionBundler = browserify({
    cache: {},
    packageCache: {},
    entries: [ './src/p2pRoom/index.js' ]
});

// Tasks

gulp.task('server', function () {
  connect.server({
    root: 'public',
    livereload: true,
    https: {
      key: fs.readFileSync(__dirname + '/server/ssl/key.pem').toString(),
      cert: fs.readFileSync(__dirname + '/server/ssl/cert.pem').toString(),
      passphrase: ''
    }
  });
});

gulp.task('browserify', function () {
  return bundler
    .bundle()
    .on('error', handle)
    .pipe(source('app.js'))
    .pipe(gulp.dest('public'));
});

gulp.task('dist', function () {
    return distributionBundler
        .bundle()
        .on('error', handle)
        .pipe(source('vidni.js'))
        .pipe(gulp.dest('dist'));
});


// Register

gulp.task('default', [ 'server', 'browserify' ], function () {
  gulp.watch(['src/**/*.js'], [ 'browserify' ]);
  gulp.watch(['public/**/*']).on('change', reload);
});

