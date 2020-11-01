const gulp = require('gulp');
const pug = require('gulp-pug');
const changed = require('gulp-changed');
const sass = require('gulp-sass');
const browserSync = require('browser-sync');
const del = require('del');
const imagemin = require('gulp-imagemin');
const data = require('gulp-data');
const fs = require('fs');
const cleanCSS = require('gulp-clean-css');
const gulpif = require( "gulp-if");
const yargs  = require("yargs");
const butternut = require('gulp-butternut');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const merge = require('merge-stream');
const tg = require("./utils/tg-notifier.js");
const provideData = require('./utils/data-provider.js');


const argv = yargs.argv,
  production = !!argv.production,
  paths = {
    styles: {
      src: 'src/assets/styles/style.scss',
      dest: 'dist/assets/css/',
      watch: [
          "src/assets/styles/**/*.scss"
      ]    
    },
    scripts: {
      src: 'src/assets/scripts/**/*.js',
      watch: 'src/assets/scripts/**/*.js',
      dest: 'dist/assets/js/',
    },
    images: {
      src: 'src/assets/img/**/*.{jpg,jpeg,gif,png,svg}',
      watch: 'src/assets/img/**/*.{jpg,jpeg,png,gif,svg}',
      dest: 'dist/assets/img/'
    },
    views: {
      src: [
          "src/views/**/*.pug"
      ],
      dest: "dist/",
      watch: [
          "src/views/**/*.pug",
          "src/site-data/*.json"
      ]
    },
    fonts: {
      src: "src/fonts/**/*.{ttf,otf,woff,woff2}",
      dest: "dist/assets/fonts/",
      watch: "src/fonts/**/*.{ttf,otf,woff,woff2}"
    }
};


function clean() {
  return del([ 'dist' ]);
};


function views (siteContents) {
  if (typeof siteContents !== 'object' || !siteContents) {
    tg("Loading siteContents from localy stored object.")
    siteContents = JSON.parse(fs.readFileSync('src/site-data/data.json'));
  };
  let tasks = [];

  siteContents["Разделы"].forEach(function(section){
    let _items = [];

    siteContents["Товары"].forEach(function(item){
      if (item.section_slug == section.slug) {
        _items.push(item)
      }
    })
    
    section['items'] = _items;

    let currentTask = gulp.src("src/views/section-layout.pug")
        .pipe(data(section))
        .pipe(pug({pretty:true}))
        .pipe(rename({
          dirname:section.slug,
          basename: 'index',
          extname: '.html' 
        }))
        .pipe(gulp.dest(paths.views.dest))
        .on("end", browserSync.reload);

     tasks.push(currentTask);
  });

  siteContents["Товары"].forEach(function(item){
    let currentTask = gulp.src("src/views/item-layout.pug")
        .pipe(data(item))
        .pipe(pug({pretty:true}))
        .pipe(rename({
          dirname:item.section_slug+'/'+item.item_slug+'/',
          basename: 'index',
          extname: '.html' 
        }))
        .pipe(gulp.dest(paths.views.dest))
        .on("end", browserSync.reload);

     tasks.push(currentTask);
  });

  let currentTask = gulp.src("src/views/mainpage.pug")
          .pipe(data(siteContents))
          .pipe(pug({pretty:true}))
          .pipe(rename({
            basename: 'index',
            extname: '.html' 
          }))
          .pipe(gulp.dest(paths.views.dest))
          .on("end", browserSync.reload);
  
  tasks.push(currentTask);
  
  return merge(tasks);
};

function styles () {
      return gulp.src(paths.styles.src, {since: gulp.lastRun('styles')})
        // .pipe(changed('dist',{extension: '.css'}))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        // .pipe(gulpif(production, cleanCSS()))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.stream());
};


function images() {
  return gulp.src(paths.images.src, {since: gulp.lastRun('images')})
    .pipe(gulpif(production, imagemin({optimizationLevel: 5})))
    .pipe(gulp.dest(paths.images.dest))
    .on("end", browserSync.reload);
};


const build = gulp.series(clean, gulp.parallel(styles, provideData(views), images));

const server = () => {
    browserSync.init({
        server: "./dist/",
        port: 4000,
        notify: true,
        open: false
    });

    gulp.watch(paths.views.watch, views);
    gulp.watch(paths.styles.watch, styles);
    // gulp.watch(paths.scripts.watch, scripts);
    gulp.watch(paths.images.watch, images);
};


function serve(done) {
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  });
  done();
}

const dev = gulp.series(clean, 
    gulp.parallel(styles, views, images),
    gulp.parallel(server));


function buildPages() {
  provideData(views);
};

exports.buildPages = buildPages;


exports.views = views;
exports.clean = clean;
exports.styles = styles;
exports.images = images;
exports.build = build;
exports.default = dev;
