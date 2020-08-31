let { src, dest } = require('gulp'),
	gulp = require('gulp'),
	fs = require('fs'),
	browsersync = require('browser-sync').create(),
	fileinclude = require('gulp-file-include'),
	del = require('del'),
	scss = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	group_media = require('gulp-group-css-media-queries'),
	// clean_css = require('gulp-clean-css'), // Минификация css
	rename = require('gulp-rename'),
	// uglify = require('gulp-uglify-es').default, // Минификация js
	// imagemin = require('gulp-imagemin'), // Сжатие картинок
	// webp = require('gulp-webp'), // Для конвертации картинок в формат webp
	// webphtml = require('gulp-webp-html'), // Для обработки html, все img переделывает в webp
	// webpcss = require('gulp-webpcss'), // Создает стили для картинок webp
	argv = require('yargs').argv; // Можно таскам давать флаги. Пример: gulp mytask --myparams=1234

var path, project_folder, source_folder;
const subfolderArr = ["", "#PRACTICE/", "#VIDEO_PRACTICE/"];
var admin = (fs.existsSync('projects-path.json')) ? true : false;

function determineProjectStart(cb) {
	if(admin === true){
		let rawdata = fs.readFileSync('projects-path.json');
		let projects_path = JSON.parse(rawdata);

		let project_ID = (argv.pj === undefined) ? projects_path.length-1 : argv.pj;
		if(project_ID < 0 || project_ID > projects_path.length-1){
			console.log('\x1b[31m%s\x1b[0m', 'Неверно указан project_ID'); cb(); return false;
		}
		console.log("project_ID: " + project_ID + "; NAME: " + projects_path[project_ID][1]);

		project_folder = "#PROJECTS/" + subfolderArr[projects_path[project_ID][0]] + projects_path[project_ID][1] + "/docs";
		source_folder = "#PROJECTS/" + subfolderArr[projects_path[project_ID][0]] + projects_path[project_ID][1] + "/#src";
	}else{
		project_folder = "docs";
		source_folder = "#src"
	}
	
	path = {
		build: {
			html: project_folder + "/",
			css: project_folder + "/css/",
			js: project_folder + "/js/",
			img: project_folder + "/img/",
			fonts: project_folder + "/fonts/",
		},
		src: {
			html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
			css: source_folder + "/scss/style.scss",
			js: [source_folder + "/js/**/*.{js,json}", "!" +  source_folder + "/js/**/_*.{js,json}"],
			img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp,mp4}",
			fonts: source_folder + "/fonts/*.{woff,woff2}",
		},
		watch: {
			html: source_folder + "/**/*.html",
			css: source_folder + "/scss/**/*.scss",
			js: source_folder + "/js/**/*.{js,json}",
			img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp,mp4}",
		},
		clean: "./" + project_folder + "/"
	}

	cb();	
}

function browserSync(params) {
	browsersync.init({
		server: {
			baseDir: "./" + project_folder + "/"
		},
		port: 3000,
		notify: false // Отключить подсказки
	})
}

function html() {
	return src(path.src.html)
		.pipe(fileinclude())
		//.pipe(webphtml()) // Добавляет webp разметку в html-код
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream())
}

function css() {
	return src(path.src.css)
		.pipe(
			scss({
				outputStyle: "expanded"
			})
		)
		.pipe(
			group_media()
		)
		.pipe(
			autoprefixer({
				overrideBrowserslist: ["last 5 versions"],
				cascade: true
			})
		)
		/*.pipe(webpcss({ //Ниже два параметра убрать если не нужно исключать иконки
			replace_from: /\.(jpg|jpeg)/,
      		replace_to:'.webp',
		})) // Подключает картинки webp в файлы стилей */
		//.pipe(dest(path.build.css))
		//.pipe(clean_css()) // Минифицирует
		//.pipe(rename({extname: ".min.css"}))
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream())
}

function js() {
	return src(path.src.js)
		.pipe(fileinclude())
		//.pipe(dest(path.build.js))
		//.pipe(uglify())
		//.pipe(rename({extname: ".min.js"}))
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream())
}

function images() {
	return src(path.src.img)
		/*.pipe(
			webp({
				quality: 70 // Качество изображения
			})
		)
		.pipe(dest(path.build.img)) 
		.pipe(src(path.src.img))*/
		/*.pipe(
			imagemin({
				progressive: true,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3 // Качество оптимизации. 0 to 7
			})
		)*/
		.pipe(dest(path.build.img))
		.pipe(browsersync.stream())
}

function fonts() {
	return src(path.src.fonts).pipe(dest(path.build.fonts));
}

function watchFiles(params) { // Прослушка файлов
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], images);
}

function clean(params) { // Удаляем директорию проекта
	return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts));
let watch = gulp.series(determineProjectStart, gulp.parallel(build, watchFiles, browserSync));

exports.determineProjectStart = determineProjectStart;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
if(admin === true){
	exports.reformatFonts = require('./task-gulp/reformatFonts.js');
	exports.png2sprite = require('./task-gulp/png2sprite.js');
	exports.svg2sprite = require('./task-gulp/svg2sprite.js');
	exports.new_pj = require('./task-gulp/createProject.js').new_pj;
	exports.info = require('./task-gulp/infoList.js').info;
	exports.info_pj = require('./task-gulp/infoList.js').info_pj;
	exports.index_pj = require('./task-gulp/indexedProjects.js');
	exports.test = require('./task-gulp/testing.js');
}
