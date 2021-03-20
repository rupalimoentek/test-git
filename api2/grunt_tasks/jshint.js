module.exports = {
    "options": {
        "node":     true,
        "laxcomma": true,
        "sub":      true,
        //"curly":   true,
        //"eqeqeq":  true,
        //"immed":   true,
        //"latedef": true,
        //"newcap":  true,
        //"noarg":   true,
        //"undef":   true,
        //"unused":  false,
        //"eqnull":  true,
        //"boss":    true
    },

    src_and_test: [
        "<%= files.src %>",
        "<%= files.test %>"
    ],

    src: [
        "<%= files.src %>"
    ],

    test: [
        "<%= files.test %>"
    ]

};