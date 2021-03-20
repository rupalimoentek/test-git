/**
 * Created by bschermerhorn on 6/3/15.
 */
module.exports = {
    test: [
        "./test/**/*.js"
    ],


    src: [
        "./bin/www",
        "./controllers/**/*.js",
        "./functions/**/*.js",
        "./models/**/*.js",
        "./routes/**/*.js",
        "./validations/**/*.js",
        "./test/**/*.js",
        "./app.js"
    ],

    config_json: [
        "./config/**/*.json"
    ],

    config_yml: [
        "./config/**/*.yml"
    ]
};