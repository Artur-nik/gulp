const { src, dest, parallel, series, watch } = require('gulp');
const sass          = require('gulp-sass');
const browserSync   = require('browser-sync').create();
const del           = require('del');
const gcmq          = require('gulp-group-css-media-queries');
const autoprefixer  = require('gulp-autoprefixer');
const concat        = require('gulp-concat');
const rename        = require('gulp-rename');
const uglify        = require('gulp-uglify-es').default;
const cssnano       = require('gulp-cssnano');
const svgmin        = require('gulp-svgmin');
const ttf2woff      = require('gulp-ttf2woff');
const ttf2woff2     = require('gulp-ttf2woff2');
const imagemin      = require('gulp-imagemin');
const svgSprite     = require('gulp-svg-sprite');
const cheerio       = require('gulp-cheerio');
const replace       = require('gulp-replace');
const fileinclude   = require('gulp-file-include');


//* dest -  build
//* dist -  файлы для отправки в dest 
//* src  -  файлы разработки
let way = "app";
// jpg,png,svg,gif,ico,webp
let path = {
    build: {
        html:       way + "/dest/",
        css:        way + "/dest/css/",
        js:         way + "/dest/js/",
        libraries:  way + "/dest/libraries/",
        svgsprite:       way + "/dest/svg-sprite/"
    },
    src: {
        html:       [way + "/src/*.html", '!' + way + "/src/template/_*.html"],
        scss:       way + "/src/scss/**/*scss",
        libraries:  way + "/src/libraries/*.js", 
        js:         way + "/src/js/*.js",
        svgsprite:  way + "/src/svg-sprite/*.svg",
    },
    fonts: {
        build:      way + "/dest/fonts/", 
        woff:       way + "/src/fonts/dist/*",
        dest:       way + "/src/fonts/dist/",
        src:        way + "/src/fonts/src/*.ttf"
    },
    img: {
        src:        way + "/src/images/*",
        dest:       way + "/src/images/dist", 
        build:      way + "/dest/images/"
    },
    watch: {
        html:       way + "/src/**/*html",
        scss:       way + "/src/scss/**/*.scss",
        js:         way + "/src/js/**/*.js",
        svgsprite:  way + "/src/svg-sprite/*.svg",
        img:        way + "/src/images/*"
    },
    clean: [way + "/dest/*"]
}


// Определяем логику работы Browsersync
function browser_sync() {
    browserSync.init({ 
        server: {
            baseDir: way,
            index: 'dest/index.html'
        },
        notify: false, // Отключаем уведомления
        online: true // Режим работы
    })
}
// 
function html() {
    return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream());
}
// sass
function styles() {
    return src(path.src.scss)
    .pipe(sass())
    .pipe(autoprefixer({overrideBrowserslist: ['>1%', 'last 4 versions']}))
    .pipe(gcmq())       // сбор медиа запросов
    .pipe(dest(path.build.css))
    .pipe(cssnano({ minifyFontValues: false, discardUnused: false }))    // сжатие файлов
    .pipe(rename({extname:".min.css"}))
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream());
}
// js
function scripts() {
    return src(path.src.js)
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(rename({extname:".min.js"}))
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream())
}
//
function libraries() {
    return src(path.src.libraries)
    .pipe(dest(path.build.libraries))
}
// watch
function startwatch() {
    watch(path.watch.scss, styles);
    watch(path.watch.js, scripts);
    watch(path.watch.html, html);
    watch(path.watch.svgsprite, svg);
    watch(path.watch.img, images);
}
//
function svg() {
    return src(path.src.svgsprite)    
    .pipe(svgmin({
        js2svg: {
            pretty: true
        }
    }))
    .pipe(cheerio({
        run: function ($) {
            $('[fill]').removeAttr('fill');
            $('[stroke]').removeAttr('stroke');
            $('[style]').removeAttr('style');
            $('[xmlns]').removeAttr('xmlns');
        },
        parserOptions: {xmlMode: true}
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
        mode: {
            symbol: {
                sprite: "../sprite.svg",
                example: true
            }
        },
        svg: {
            xmlDeclaration: false,
        }
    }))
    .pipe(dest(path.build.svgsprite))
    .pipe(browserSync.stream());
}

//
function fonts() {
    src(path.fonts.src)
    .pipe(ttf2woff())
    return src(path.fonts.src)
    .pipe(ttf2woff2())
    .pipe(dest(path.fonts.dest));
}
//
function fontsBuild() {
    return src(path.fonts.woff)
    .pipe(dest(path.fonts.build));
}
//
function images() {
    return src(path.img.src)
    .pipe(dest(path.img.build)) 
    .pipe(browserSync.stream());
}
// удаление папки dest
function cleandest() {
    return del(path.clean);
}


exports.browser_sync = browser_sync;
exports.html = html;
exports.scripts = scripts;
exports.styles = styles;
exports.startwatch = startwatch;
exports.cleandest = cleandest;
exports.svg = svg;
exports.images = images;
exports.fonts = fonts;
exports.fontsBuild = fontsBuild;
exports.libraries = libraries;
exports.default = series(cleandest, libraries, fontsBuild, parallel(styles, scripts, browser_sync, html, svg, images, startwatch));