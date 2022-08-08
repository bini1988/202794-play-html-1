const stream = require('stream');
const path = require('path');
const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass')(require('sass'));
const inlineCss = require('gulp-inline-css');

const IS_PRODUCTION = (process.env.NODE_ENV || 'production') === 'production';
const TEMP_DIR = 'tmp';
const DEST_DIR = IS_PRODUCTION ? './' : 'tmp/';

function server() {
  browserSync.init({
    server: { baseDir: DEST_DIR },
    notify: false,
    online: true,
  })
}

function cdn() {
  const IMG_REGEXP = /\ssrc="(img\/.+?)"\s/gi;
  const CDN_PATH = 'https://raw.githubusercontent.com/bini1988/202794-play-html-1/module2-task2/';

  return new stream.Transform({
    objectMode: true,
    /**
     * @param {import("vinyl")} file
     */
    transform(file, enc, cb) {
      if (file.isNull()) {
        return cb(null, file);
      }
      if (IS_PRODUCTION && file.isBuffer()) {
        file.contents = Buffer.from(
          file.contents.toString().replace(IMG_REGEXP, (_, filepath) =>
            ` src="${CDN_PATH}${path.join(path.dirname(file.relative), filepath)}" `,
          ),
        );
        return cb(null, file);
      }
      return cb(null, file);
    },
  });
}

function html() {
  return gulp.src(['src/**/*.html'])
    .pipe(gulp.dest(DEST_DIR))
    .pipe(cdn())
    .pipe(inlineCss({
      applyStyleTags: true,
      applyLinkTags: true,
      preserveMediaQueries: true,
      applyWidthAttributes: false,
      applyTableAttributes: false,
      removeHtmlSelectors: IS_PRODUCTION,
    }))
    .pipe(gulp.dest(DEST_DIR))
}

function styles() {
  return gulp.src(['src/**/styles/**/*.scss', '!src/sass/**'], { base: 'src' })
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(DEST_DIR))
}

function images() {
  return gulp.src(['src/**/img/**/*.*'], { base: 'src' })
    .pipe(gulp.dest(DEST_DIR));
}

function watch() {
  gulp.watch(['src/**/*.(html|scss)'], gulp.series(styles, html));
  gulp.watch(['src/**/img/**/*'], images);

  gulp.watch([`${DEST_DIR}**/*.html`]).on('change', browserSync.reload);
  gulp.watch([`${DEST_DIR}**/img/**/*`]).on('change', browserSync.reload);
}

function clean() {
  return del(TEMP_DIR, { force: true });
}

function cleanup() {
  return del(['./**/styles', '!src/**'], { force: true });
}

const build = gulp.series(clean, styles, html, images);

exports.clean = clean;
exports.build = gulp.series(build, cleanup);
exports.default = gulp.series(build, gulp.parallel(server, watch));
