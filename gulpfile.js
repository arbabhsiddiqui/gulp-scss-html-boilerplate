// const gulp = require('gulp');
const { src, series, parallel, dest, watch } = require('gulp');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('autoprefixer');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const rollup = require('gulp-better-rollup');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const imageWebp = require('gulp-webp');
const fileInclude = require('gulp-file-include');
const browsersync = require('browser-sync').create();

const SOURCE = 'src';
const DEV = 'dev';
const PROD = 'dist';

const SRC_JS_PATH = `${SOURCE}/js/**/**/*.js`;
const SRC_HTML_PATH = `${SOURCE}/*.html`;
const SRC_CSS_PATH = `${SOURCE}/scss/**/*.scss`;
const SRC_IMAGE_PATH = `${SOURCE}/images/**/*.{jpg,png,mp4}`;

const DEV_JS_PATH = `${DEV}/js`;
const DEV_CSS_PATH = `${DEV}/css`;
const DEV_IMAGE_PATH = `${DEV}/images`;

const PROD_JS_PATH = `${PROD}/js`;
const PROD_CSS_PATH = `${PROD}/css`;
const PROD_IMAGE_PATH = `${PROD}/images`;

/* ******************************* 
html task block
***************************************** */
// Combine HTML files

function combineHtmlTaskForDevelopment() {
  return src(SRC_HTML_PATH)
    .pipe(fileInclude({ prefix: '@@', basepath: '@file' }))
    .pipe(dest(DEV));
}

function combineHtmlTaskForProduction() {
  return src(SRC_HTML_PATH)
    .pipe(fileInclude({ prefix: '@@', basepath: '@file' }))
    .pipe(dest(PROD));
}

/* ******************************* 
html task block end
***************************************** */

/* ******************************* 
image compression task block
***************************************** */

// compresses images
function imgCompressionTask() {
  return src(SRC_IMAGE_PATH)
    .pipe(imagemin())
    .pipe(dest(`${SOURCE}/compressImage`));
}

function convertImagesIntoWebPImagesTaskForDevelopment() {
  return src(`${SOURCE}/compressImage/**/*`)
    .pipe(imageWebp())
    .pipe(dest(DEV_IMAGE_PATH));
}

function convertImagesIntoWebPImagesTaskForProduction() {
  return src(`${SOURCE}/compressImage/**/*`)
    .pipe(imageWebp())
    .pipe(dest(PROD_IMAGE_PATH));
}

/* ******************************* 
image compression task block end
***************************************** */

/* ******************************* 
css task block
***************************************** */

// Compile SCSS to CSS, create sourcemaps for development
function cssTaskForDevelopment() {
  return src(SRC_CSS_PATH)
    .pipe(sass())
    .pipe(sourcemaps.init())
    .pipe(concat('style.css'))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(DEV_CSS_PATH));
}

// Compile SCSS to CSS, minify for production
function cssTaskForProduction() {
  return src(SRC_CSS_PATH)
    .pipe(sass())
    .pipe(concat('style.css'))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(dest(PROD_CSS_PATH));
}

/* ******************************* 
css task block end
***************************************** */

/* ******************************* 
js task block
***************************************** */

// Bundle JavaScript with Rollup, create sourcemaps for development
function jsTaskForDevelopment() {
  return src(SRC_JS_PATH)
    .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, 'umd'))
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(DEV_JS_PATH));
}

// Bundle JavaScript with Rollup, minify for production
function jsTaskForProduction() {
  return src(SRC_JS_PATH)
    .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, 'umd'))
    .pipe(concat('main.js'))
    .pipe(terser())
    .pipe(dest(PROD_JS_PATH));
}

/* ******************************* 
js task block  end
***************************************** */

// Setup BrowserSync server for live reload
function browserSyncServe(cb) {
  browsersync.init({
    server: { baseDir: `${DEV}` },
    notify: { styles: { top: 'auto', bottom: '0' } },
  });
  cb();
}

// Reload BrowserSync server
function browserSyncReload(cb) {
  browsersync.reload();
  cb();
}

// Watch for file changes and trigger tasks
function watchTask() {
  watch(
    ['src/*.html', './src/templates/*.html'],
    { interval: 1000 },
    series(combineHtmlTaskForDevelopment, browserSyncReload)
  );
  watch(
    [SRC_CSS_PATH, SRC_JS_PATH],
    { interval: 1000 },
    series(cssTaskForDevelopment, jsTaskForDevelopment, browserSyncReload)
  );
}

// Default task for development
exports.default = series(
  parallel(
    combineHtmlTaskForDevelopment,
    cssTaskForDevelopment,
    jsTaskForDevelopment
  ),
  imgCompressionTask,
  convertImagesIntoWebPImagesTaskForDevelopment,
  browserSyncServe,
  watchTask
);

// Production tasks
exports.build = series(
  parallel(
    combineHtmlTaskForProduction,
    cssTaskForProduction,
    jsTaskForProduction
  ),
  imgCompressionTask,
  convertImagesIntoWebPImagesTaskForProduction
);

// Compress images for `development`
exports.compressImagesDev = series(
  imgCompressionTask,
  convertImagesIntoWebPImagesTaskForDevelopment
);

// Compress images for `production`
exports.compressImagesBuild = series(
  imgCompressionTask,
  convertImagesIntoWebPImagesTaskForProduction
);
