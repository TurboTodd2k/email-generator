'use strict';
var _ = require('lodash');
var path = require('path');


module.exports = function(grunt) {


    /* CONFIGURATION =-=-=-=-=-=-=-=-=-=-=- */

    //directory to put images for testing
    var testImgSourcePath = '_dev/assets/images/';
    var testImgUploadPath = '/test/'


    //path for imgs for renaming
    var testNewImgPath = 'http://quigleysimpsondigital.com/email-testing/test/'


    //varibles for the xerox page template and data files
    var templatePath = 'source/_pages/responsive-template.mustache';
    var dataPath = 'source/_pages/*.json';
    var layout = 'default.mustache';


    //varibles for current page targets
    var sourceTemplate = ['source/_pages/responsive-template.mustache'];
    var sourceLayout = 'default.mustache';





    /* XEROX =-=-=-=-=-=-=-=-=-=-=- */

    // load the page template from the desired path
    var pageTemplate = grunt.file.read(templatePath);

    // expand the data files and loop over each filepath
    var pages = _.flatten(_.map(grunt.file.expand(dataPath), function(filepath) {

        // read in the data file
        var data = grunt.file.readJSON(filepath);

        // create a 'page' object to add to the 'pages' collection
        return {
            // the filename will determine how the page is named later
            filename: path.basename(filepath, path.extname(filepath)),
            // the data from the json file
            data: data,
            // add the page template as the page content
            content: pageTemplate
        };
    }));


    // measures the time each task takes
    require('time-grunt')(grunt);


    // Project configuration.
    grunt.initConfig({

        gpl: require('./source/_data/sg-config.json'),


        /******************************************************
         * HTML TASKS
         ******************************************************/


        assemble: {

            options: {
                flatten: true,
                partials: ['source/_patterns/**/*.mustache'],
                layoutdir: 'source/_layouts',
                layout: 'default.mustache',
                //assets: 'assets/',
                data: ['source/_data/*.json', 'source/_pages/*.json'],
                helpers: ['handlebars-helper-aggregate']
            },

            //this is the target for publishing data based versions of a template, sources are set in the varibles up top
            xeroxDev: {
                options: {
                    layout: layout,
                    // add the pages array from above to the pages collection on the assemble options
                    pages: pages
                },
                files: [
                    // currently we need to trick grunt and assemble into putting the pages file into the correct
                    // place using this pattern
                    { dest: './_dev/', src: '!*' }
                ]
            },

            xeroxProduction: {
                options: {
                    layout: layout,
                    // add the pages array from above to the pages collection on the assemble options
                    pages: pages
                },
                files: [
                    // currently we need to trick grunt and assemble into putting the pages file into the correct
                    // place using this pattern
                    { dest: './_production/', src: '!*' }
                ]
            },

            //style guide publishing target
            gpl: {
                options: {
                    layout: 'gpl-layout.mustache',
                    aggregate: {
                        cwd: 'source/_patterns/',
                        sep: '\n\n'
                    }
                },
                files: {
                    '_dev/style-guide/': ['source/_pages/sg-*.mustache']
                }
            },

            //target for page dev
            dev: {
                options: {
                    layout: sourceLayout
                },
                files: {
                    '_dev/': sourceTemplate
                }
            },

            //target for page release
            production: {
                options: {
                    production: true,
                    layout: sourceLayout
                },
                files: {
                    '_production/': sourceTemplate
                }
            },

        },


        processhtml: {
            //these are working
            production: {
                options: {},
                files: [{
                    expand: true,
                    cwd: '_production', // Src matches are relative to this path
                    src: '*.html', // Actual patterns to match
                    dest: '_production' // Destination path prefix
                }]
            }
        },


        htmlmin: { // Task
            dev: { // Target
                options: { // Target options
                    removeEmptyAttributes: true,
                    collapseWhitespace: true,
                    minifyCSS: true
                },
                files: [{
                    expand: true,
                    cwd: '_dev',
                    src: ['*.html'],
                    dest: '_dev'
                }]
            }
        },



        //tidy up html output
        prettify: {
            options: {
                // Task-specific options go here.
                indent: 1,
                indent_char: '	',
                unformatted: ['a', 'sub', 'sup', 'b', 'i', 'u', 'strong', 'em']
            },
            dev: {
                // Target-specific file lists and/or options go here.
                expand: true, // Enable dynamic expansion
                cwd: '_dev', // Src matches are relative to this path
                src: ['*.html'], // Actual patterns to match
                dest: '_dev' // Destination path prefix
            }
        },


        replace: {
            dist: {
                options: {
                    patterns: [{
                        match: /src="assets\/images\//,
                        replacement: 'src="http://quigleysimpsondigital.com/email-testing/test/'
                    }]
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['_dev/*.html'],
                    dest: '_dev/'
                }]
            }
        },








        /******************************************************
         * CSS TASKS
         ******************************************************/

        // convert sass to css/**/*
        sass: {
            options: {
                sourceMap: true
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'source/assets/css/',
                    src: ['*.scss'],
                    dest: 'source/assets/css/',
                    ext: '.css'
                }]
            }
        },


        //extract only used css
        uncss: {
            production: {
                files: {
                    '_production/assets/css/tidy.css': ['_production/*.html']
                }
            },
        },

        //and process the shit out of it
        postcss: {

            dev: {
                options: {
                    map: false, // inline sourcemaps
                    processors: [
                        require('postcss-style-guide')({ name: 'Auto Style Guide', dest: '_dev/style-guide/index.html' })
                    ]
                },
                src: '_dev/assets/css/style.css',
                dest: '_dev/css/style-min.css',
            },
            production: {
                options: {
                    map: false, // inline sourcemaps
                    processors: [
                        require('autoprefixer')({ browsers: 'last 2 versions' }), // add vendor prefixes
                        require('cssnano')() // minify the result
                    ]
                },
                src: '_production/assets/css/tidy.css',
                dest: '_production/assets/css/tidy-min.css',
            }
        },


        juice: {
            options: {
                preserveMediaQueries: true,
                applyAttributesTableElements: true,
                applyWidthAttributes: true,
                preserveImportant: true,
                preserveFontFaces: true,
                webResources: {
                    images: false
                }
            },
            dev: {
                files: [{
                    expand: true,
                    cwd: '_dev/',
                    src: ['*.html'],
                    dest: '_dev/'
                }]
            },
            production: {
                files: [{
                    expand: true,
                    cwd: '_production/',
                    src: ['*.html'],
                    dest: '_production/'
                }]
            }
        },



        //remove classes that have been inlined
        unclassify: {
            options: {
                // Task-specific options go here.
                dry: true,
                customClasses: ['deviceWidth', 'center'],
            },
            dev: {
                // Target-specific file lists and/or options go here.
                files: {
                    '_dev/': ['_dev/*.html']
                }
            },
            production: {
                // Target-specific file lists and/or options go here.
                files: {
                    '_production/': ['_production/*.html']
                }
            }
        },







        /******************************************************
         * IMAGE TASKS
         ******************************************************/

        img_find_and_copy: {
            resources: {
                files: {
                    '_production/tempImages': ['_production/assets/css/**/*.css', '_production/*.html']
                }
            }
        },


        imagemin: { // Task

            production: { // Another target
                options: { // Target options
                    optimizationLevel: 3,
                    svgoPlugins: [{ removeViewBox: false }],
                    //use: [mozjpeg()]
                },
                files: [{
                    expand: true, // Enable dynamic expansion
                    cwd: '_production/tempImages', // Src matches are relative to this path
                    src: ['**/*.{png,jpg,jpeg,gif}'], // Actual patterns to match
                    dest: '_production/tempImages/processed' // Destination path prefix
                }]
            }
        },


        localscreenshots: {

            production: {
                options: {
                    path: '_production/screenshots',
                    type: 'png',
                    local: {
                        path: '_production',
                        port: 8090
                    },
                    viewport: ['768x800', '992x1024', '1200x1024'],
                },
                src: ['_production/*.html']
            },

            dev: {
                options: {
                    path: '_dev/screenshots/<%= grunt.template.today("mm-dd-yyyy") %>_@_<%= grunt.template.today("hh-MM-ss") %>',
                    type: 'png',
                    local: {
                        path: '_dev',
                        port: 8090
                    },
                    viewport: ['768x800', '992x1024', '1200x1024'],
                },
                src: ['_dev/patterns/04-pages*/**/*.html', '!_dev/patterns/04-pages*/**/*.markup-only.html']
            }

        },






        /******************************************************
         * TESTING
         ******************************************************/

        mailgun: {
            marketingTemplates: {
                options: {
                    key: 'key-84a1b61b960baff286344b54bcc12f82',
                    domain: 'sandbox7ce983c7851441f2816432b634ff3a4e.mailgun.org',
                    sender: 'noreply@example.com',
                    recipient: 'toddk@quigleysimpson.com',
                    subject: 'This is a test email'
                },
                src: ['_dev/*.html']
            }
        },


        htmllint: {
            options: {
                errorlevels: 'error'
            },
            all: ["_dev/*.html"]
        },






        validation: {
            options: {
                reset: grunt.option('reset') || false,
                stoponerror: false,
                doctype: 'HTML 4.01 Strict',
                //or
                relaxerror: ['Bad value X-UA-Compatible for attribute http-equiv on element meta.'], //ignores these errors
                generateReport: true,
                errorHTMLRootDir: "_dev/w3cErrorFolder",
                useTimeStamp: true,
                errorTemplate: "source/assets/error-templates/error_template.html"
            },
            files: {
                src: ['_dev/*.html']
            }
        },






        /******************************************************
         * HOUSEKEEPING AND UTILITY
         ******************************************************/

        copy: {
            dev: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['assets/**/*'],
                    dest: '_dev/'
                }],
            },
            production: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['assets/**/*'],
                    dest: '_production/'
                }],
            },
            productionImages: {
                files: [{
                    expand: true,
                    flatten: true,
                    filter: 'isFile',
                    cwd: '_production/tempImages/processed/_production/assets/images/',
                    src: ['**'],
                    dest: '_production/images/'
                }],
            },
        },

        mkdir: {
            all: {
                options: {
                    create: ['_production/tempImages', '_production/screenshots']
                },
            },
        },

        clean: {
            output: {
                options: {},
                src: ['_dev/*', '!_dev/screenshots', '_production/*']
            },
            productionImages1: {
                options: {},
                src: ['_production/assets/images/*']
            },
            productionImages2: {
                options: {},
                src: ['_production/tempImages', '_production/assets']
            },
            productionCss: {
                options: {},
                src: ['_production/assets/css/*', '!_production/assets/css/tidy.css']
            }
        },



        // update the version number of our package file
        version: {
            dev: {
                options: {
                    release: 'patch'
                },
                src: [
                    'package.json'
                ]
            },
            production: {
                options: {
                    release: 'minor'
                },
                src: [
                    'package.json'
                ]
            }
        },



        ftp_push: {
            your_target: {
                options: {
                    authKey: "serverA",
                    host: "quigleysimpsondigital.com",
                    dest: testImgUploadPath,
                    port: 21,
                    incrementalUpdates: true
                },
                files: [{
                    expand: true,
                    cwd: testImgSourcePath,
                    src: ["**/*.jpg", "**/*.gif", "**/*.png"]
                }]
            }
        },



        //task specific server
        connect: {
            server: {
                options: {
                    port: 8090,
                    base: ['release'],
                    //keepalive: true,
                    //open: true
                }
            }
        }


    });





    // Load the grunt plugins.
    grunt.loadNpmTasks('grunt-assemble');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-img-find-and-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-localscreenshots');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-version');
    grunt.loadNpmTasks('grunt-prettify');
    grunt.loadNpmTasks('grunt-mailgun');
    grunt.loadNpmTasks('grunt-juice');
    grunt.loadNpmTasks('grunt-unclassify');
    grunt.loadNpmTasks('grunt-ftp-push');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-html');
    grunt.loadNpmTasks('grunt-w3c-html-validation');

    //probabaly not needed
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-uncss');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');





    // The default task to run with the `grunt` command.
    grunt.registerTask('default', ['assemble', 'copy:dev']);

    //for style guide
    grunt.registerTask('gpl', ['assemble:gpl', 'copy:dev', 'postcss:dev']);

    //for sending test emails
    grunt.registerTask('testing', ['ftp_push', 'replace', 'mailgun']);

    //HTML validation
    grunt.registerTask('w3test', ['validation']);



    //for dev template/data publishing
    grunt.registerTask('xeroxDev', ['clean:output', 'assemble:xeroxDev', 'sass', 'copy:dev', 'juice:dev', 'unclassify:dev', 'prettify:dev', 'version:dev']);

    //for production template/data publishing
    grunt.registerTask('xeroxProduction', ['clean:output', 'mkdir', 'assemble:xeroxProduction', 'sass', 'copy:production', 'production:css', 'production:images', 'prettify:dev', 'connect', 'localscreenshots:production', 'version:production']);



    //for single file template/data dev
    grunt.registerTask('dev', ['clean:output', 'assemble:dev', 'sass', 'copy:dev', 'juice:dev', 'unclassify:dev', 'prettify:dev', 'version:dev']);

    //for single file template/data production
    grunt.registerTask('production', ['clean:output', 'mkdir', 'assemble:production', 'sass', 'copy:production', 'production:css', 'production:images', 'prettify:dev', 'connect', 'localscreenshots:production', 'version:production']);



    //support tasks for production
    grunt.registerTask('production:css', ['juice:production', 'unclassify:production', ]);
    grunt.registerTask('production:images', ['img_find_and_copy', 'imagemin:production', 'clean:productionImages1', 'copy:productionImages', 'clean:productionImages2', 'processhtml:production']);






};
