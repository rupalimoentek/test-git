/**
 * Created by davey on 4/7/15.
 */
var connector = require('../models/appModel'),
	f = require('../functions/functions.js'),
	appModel = require('../models/appModel.js'),
	stringify = require('csv-stringify'),
	js2xmlparser = require("js2xmlparser"),
	json2xls = require('json2xls');

var formatter = {
	export: function(data, format, res) {
		//res.type(format);
		//res.set('Content-Disposition: attachment; filename="data_export.' + format + '"');
		console.log("FORMATTING to " + format);

		switch (format) {
			case 'csv':
	            var str = stringify({ header:true, columns:data});
				res(str);
				console.log("*** formatted CSV ***");
				console.log(str);
				break;

			case 'tsv':
				var str = stringify({ header:true, columns:data, delimiter:"\t"});
				res(str);

			case 'xml':
				var str = js2xmlparser("data_export", JSON.stringify(data));
				res(str);
				break;

			case 'xls':
				var str = json2xls(data);
				res(str);
				/*fs.writeFileSync('data_export.xlsx', xls, 'binary');
				//	or
				app.use(json2xls.middleware);
				app.get('/', function(res) {
				    res.xls('data.xlsx', jsonArr);
				});
				*/
				break;
			default:
				JSON.stringify(data);
				break;
		}
	}
}

module.exports = formatter;