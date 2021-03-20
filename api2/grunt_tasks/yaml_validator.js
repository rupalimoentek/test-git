/**
 * Created by bschermerhorn on 6/3/15.
 */

//module.exports = {
//    defaults: {
//        src: [
//            "<%= files.config_yml %>"
//        ]
//    }
//};

module.exports = function (grunt) {
    //grunt.log.writeln("\nLinting YML files in '/config'"['blue'].bold);
    return {
        defaults: {
            src: [
                "<%= files.config_yml %>"
            ]
        }
    };
};















