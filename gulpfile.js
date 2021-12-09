const gulp = require("gulp");
const { src, series, parallel, dest, watch } = require("gulp");

//* importing gulp plugins

const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("autoprefixer");

//* scss plugins
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");

//* html plugins
const fileInclude = require("gulp-file-include");

//* image plugin
const imagemin = require("gulp-imagemin");
const imageWebp = require("gulp-webp");

//* js plugin
const rollup = require("gulp-better-rollup");
const babel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const terser = require("gulp-terser");

//* create local sever
const browsersync = require("browser-sync").create();

//! define paths for source and destination
const SOURCE = "src";
const DIST = "dist";

const SRC_JS_PATH = `${SOURCE}/js/**/**/*.js`;
const SRC_HTML_PATH = `${SOURCE}/*.html`;
const DIST_JS_PATH = `${DIST}/js`;
const SRC_CSS_PATH = `${SOURCE}/scss/**/*.scss`;
const DIST_CSS_PATH = `${DIST}/css`;
const SRC_IMAGE_PATH = `${SOURCE}/images/**/*.{jpg,png,mp4}`;
const DIST_IMAGE_PATH = `${DIST}/images`;

//! combine html
function combineHtml() {
  return src(SRC_HTML_PATH)
    .pipe(
      fileInclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(gulp.dest(DIST));
}

//* compress images and copy them into dist/images folder
function imgCompressionTask() {
  return src(SRC_IMAGE_PATH)
    .pipe(imagemin())
    .pipe(gulp.dest(`${SOURCE}/compressImage`));
}

//* convert Them into webp images !!Folder Location dist/images
function convertImagesIntoWebPeTask() {
  return src(`${SOURCE}/compressImage/**/*`)
    .pipe(imageWebp())
    .pipe(gulp.dest(DIST_IMAGE_PATH));
}

//* minify js and copy them into  dist/js folder
function jsTask() {
  return src(SRC_JS_PATH)
    .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, "umd"))
    .pipe(sourcemaps.init())
    .pipe(concat("main.js"))
    .pipe(terser())
    .pipe(sourcemaps.write("."))
    .pipe(dest(DIST_JS_PATH));
}

// *convert scss to css then minify then  copy them into  dist/css folder
function cssTask() {
  return src(SRC_CSS_PATH)
    .pipe(sass())
    .pipe(sourcemaps.init())
    .pipe(concat("style.css"))
    .pipe(postcss([autoprefixer(), cssnano()])) //not all plugins work with postcss only the ones mentioned in their documentation
    .pipe(sourcemaps.write("."))
    .pipe(dest(DIST_CSS_PATH));
}

//* BrowserSync Server setup a sever for live reload
function browserSyncServe(cb) {
  browsersync.init({
    server: {
      baseDir: "./dist/",
    },
    notify: {
      styles: {
        top: "auto",
        bottom: "0",
      },
    },
  });
  cb();
}

//*  listen for changes in files
function browserSyncReload(cb) {
  browsersync.reload();
  cb();
}

//*  watch changes in files
function watchTask() {
  //*  watch changes occur in html files
  watch(
    ["src/*.html", "./src/templates/*.html"],
    { interval: 1000 },
    series(combineHtml, browserSyncReload)
  );
  //* changes in images
  watch("src/images/**/*.{jpg,png}", imgCompressionTask);

  watch("dist/images/**/*.{jpg,png}", convertImagesIntoWebPeTask);
  //* watch changes occur in scss and js
  watch(
    [SRC_CSS_PATH, SRC_JS_PATH],
    { interval: 1000 },
    series(cssTask, jsTask, browserSyncReload)
  );
}

//* exporting functions
exports.cssTask = cssTask;
exports.jsTask = jsTask;
exports.imgCompressionTask = imgCompressionTask;
exports.convertImagesIntoWebPeTask = convertImagesIntoWebPeTask;

//* setup default task generate dist and wait for changes
exports.default = series(
  parallel(
    combineHtml,
    imgCompressionTask,
    convertImagesIntoWebPeTask,
    jsTask,
    cssTask
  ),
  browserSyncServe,
  watchTask
);
