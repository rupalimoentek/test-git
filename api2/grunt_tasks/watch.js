/**
 * Created by bschermerhorn on 6/2/15.
 */
module.exports = {
    test: {
        files: [
            "<%= files.test %>"
        ],
        tasks: ["jshint:test", "mochaTest"]
    },

    src: {
        files: [
            './app.js',
            "<%= files.src %>"
        ],
        tasks: ["jshint:src", "mochaTest"]
    },

    configs: {
        files: [
            "<%= files.config_yml %>",
            "<%= files.config_json %>"
        ],
        tasks: ["yaml_validator", "jsonlint"]
    }


};