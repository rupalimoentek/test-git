var controller = require('./appController'),
	locationRouteModel = require('../models/locationRouteModel'),
	yaml = require("js-yaml"),
	fs = require("fs"),
	d = yaml.load(fs.readFileSync('./config/directories.yml'));
	var CSV = require('csv-string');

var locationRoute = {
	importAction: function(req, res){
		var filename = req.files.file.name;
		var src = d.file_upload + filename;
		var file = fs.readFileSync(src);
		file = file.toString().replace(/(\r\n|\r)/gm,"\n");
		var lines = CSV.parse(file);
		var fields = lines[0];
		var reg = /^\d+$/;
		var data = {
			location_id: req.body.location_id,
			routes: [],
			fields: fields
		};
		lines.splice(0, 1);
		if(req.is_migrated){
			var headers	=['Location (Required)','Address (Required)','City (Required)','State/Province (Required)','Zip/Postal Code (Required)','10-Digit Phone (Required)','Claimed States/Province (Optional)','Claimed Zip (Optional)'];
			for (var i = 0; i < fields.length; i++) {
				if(fields[i] !== headers[i] && headers[i]!== 'Claimed States/Province (Optional)' && headers[i]!== 'Claimed Zip (Optional)'){
					var err = {"status":"error","err":["Header '"+ headers[i] +"' is missing.'"]};
					res(err);
					return;
				}
			};	
		}else{
			var headers	=['Location (Required)','Address (Required)','City (Required)','State/Province (Required)','Zip/Postal Code (Required)','10-Digit Phone (Required)','Claimed Zip (Optional)'];

			for (var i = 0; i < fields.length; i++) {
				if(fields[i] !== headers[i] && headers[i]!== 'Claimed Zip (Optional)'){
					var err = {"status":"error","err":["Header '"+ headers[i] +"' is missing.'"]};
					res(err);
					return;
				}
			};
	
		}
		// if any cell in csv is empty.
		for (var i = 0; i < lines.length; i++) {
			for (var j = 0; j < lines[i].length; j++) {
				if(j === lines[i].length-1) continue;
				if(lines[i][j] === '' && headers[j] !== 'Claimed States/Province (Optional)'){
					var errorsFound = {"status":"error","err":["Required fields should not be empty from row "+(parseInt(i)+2)+".column :"+headers[j]]};					
					res(errorsFound);
					return;
				}	

				if(headers[j] === '10-Digit Phone (Required)' && !reg.test(lines[i][j])){
					var errorsFound = {"status":"error","err":["Enter valid number for row "+(parseInt(i)+2)+".column : Phone"]};					
					res(errorsFound);
					return;
				}
						
			};
		};

		for (var i = 0; i < data.routes.length; i++) {
			
			
		}
		async.eachSeries(lines, function(line,cb){
			var temp_data = {};
			for (var j = 0; j < line.length; j++) {
				fields[j] = fields[j].replace("(Required)","");
				fields[j] = fields[j].replace("(Optional)","");
				fields[j] = fields[j].replace("10-Digit","");
				fields[j] = fields[j].replace("Codes","");
				fields[j] = fields[j].replace("/Province","");
				fields[j] = fields[j].replace("/Postal Code","");
				fields[j] = fields[j].replace("/Postal","");
				fields[j] = fields[j].trim();
				if(line[j].toString().replace(/\|/g, ',').length || fields[j].toLowerCase().replace(" ","_") === "claimed_zip")
					temp_data[fields[j].toLowerCase().replace(" ","_")] = line[j].toString().replace(/\[|\]/g, '');
			}
			data.routes.push(temp_data);
			setImmediate(cb);
		},
		function(err){
			// data.fields = fields;
			locationRouteModel.import(data, function(err, data){
				controller.responsify(err, data, function(response){
					res(response);
			});
		});
      });

	},
	createAction: function(req, res){
		locationRouteModel.create(req.body, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	updateAction: function(req, res){
		locationRouteModel.update(req , function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	},
	deleteAction: function(id,res){
		locationRouteModel.delete(id, function(err, data){
			controller.responsify(err, data, function(response){
				res(response);
			});
		});
	}
};

module.exports = locationRoute;
