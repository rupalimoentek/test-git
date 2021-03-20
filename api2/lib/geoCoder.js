var geocoderProvider = 'google';
var httpAdapter = 'http';
var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: "AIzaSyD870Yt4lpJjKKSK5PrOPcKgLFJvjfCYDg", // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

var nodeGeoCoder = NodeGeocoder(options);

var geoCode = {
	geocode: function(data, res){
		if (!data.address || !data.city || !data.state || !data.zip) {
			res("Missing Address Info.");
			return;
		}
		var address = data.address + ' ' + data.city + ' ' + data.state + ' ' + data.zip;
		var done = false;
		var cntr = 0;
		var geoData = [];
		var limit = 4;
		console.log('Geodata for: '+ address);
		async.until(
			function () {
				return done;
			},
			function(cb){
			cntr++;
			nodeGeoCoder.geocode(address, function(err, d){
				console.log("Geo Route: ", err);
				if (err || d.length < 1) {
					console.log('Geocoder error. Retrying: '+cntr+' of '+limit+' requests. ');
					if (cntr > limit) {
						cb("For zip "+data.zip+" may be Location, Address, City or State is incorrect. Please enter valid details.");
						//cb('Error retrieving geocode data.'+address);
					}	else {
						setTimeout(cb, 1000);
					}
				} else {
					geoData = d;
					done = true;
					cb(err);
				}
			});
		},
		function(err){
			res(err, geoData);
		});
	},
	batchGeocode: function(data, res){		
		var addressData = [];
		var addressDataTemp = [];
		var cnt = 1;		
		var address;
		for (var i = 0; i < data.length; i++) {		
			if (!data[i].address || !data[i].city || !data[i].state || !data[i].zip) {
				res("Missing Address Info.");
				return;
			}
			if(cnt<=50) {
				address = data[i].address + ' ' + data[i].city + ' ' + data[i].state + ' ' +data[i].zip;	
				addressDataTemp.push(address);
				if(cnt==50){
					addressData.push({"chunk":addressDataTemp});					
					addressDataTemp = [];
					cnt = 0;
				}
				//Add remaining records
				if(data.length-1 == i && addressData.length*50 < data.length){
					addressData.push({"chunk":addressDataTemp});
				}				
				cnt++;
			}
		};
		
		console.log(addressData.length,data.length);	
		var response = [];
		async.eachSeries(addressData, function(data, cb){
			console.log("Getting Zip for:",data.chunk.length+" Records");			
			nodeGeoCoder.batchGeocode(data.chunk, function(err, result){
				if(err){
					return cb(err);
				}
				console.log("Got Zips COUNT:",result.length);
				async.each(result, function(record, cb2){
					response.push(record);
					cb2(null);
				},
				function(err){
					cb(null);
				});
			});
		},function(err){
			if(err) {
				console.log("FOUND ERROR:",err);
				res(err);
			} else{				
				console.log("response LENGHT",response.length);
				//console.log("response:",JSON.stringify(response));
				res(err, response);
			}
		});
	}

};

module.exports = geoCode;