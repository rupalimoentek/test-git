var connector = require('./appModel'),
	f = require('../functions/functions.js'),
	table = 'ce_geo_lookup',
	table1 = 'npanxx_city';

var geoLookups = {
	byCity: function(str, res) {
		var qry = "SELECT DISTINCT ON (npa)npa, npanxx, state, city, rc FROM " + table1 + " WHERE city LIKE '" + str + "%' GROUP BY  state, city, npa, npanxx, rc ";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	byNpaZip: function(str, res) {
		var qry = "SELECT city, state FROM " + table + " WHERE npa LIKE '" + str + "%' OR zipcode LIKE '" + str + "%' GROUP BY city,state ORDER BY city ASC, state ASC";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	byZip: function(str, res) {
		var qry = "SELECT city, state FROM " + table + " WHERE zipcode LIKE '" + str + "%' GROUP BY city,state ORDER BY city ASC, state ASC";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	byNpa: function(str, res) {
		var qry = "SELECT npa, npanxx, city, state, rc FROM " + table1 + " WHERE npa =" + str +" AND city IS NOT NULL AND rc IS NOT NULL GROUP BY city,state,npa,npanxx,rc ORDER BY city ASC, state ASC";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	npanxxCityState: function(city, state, res) {
		var qry = "SELECT npanxx FROM " + table + " WHERE city = '" + city + "' AND state = '" + state + "' GROUP BY npanxx";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	npanxxCityStateNpa: function(city, state, npa, res) {
		var qry = "SELECT npanxx FROM " + table1 + " WHERE city = '" + city.toUpperCase() + "' AND state = '" + state.toUpperCase() + "' AND npa = '" + npa + "' GROUP BY npanxx";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	npanxxZip: function(zip, res){
		var qry = "SELECT npanxx FROM " + table + " WHERE zipcode = '" + zip + "' GROUP BY npanxx";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	},
	npanxxNpa: function(npa, res){
		var qry = "SELECT npanxx FROM " + table + " WHERE npa = '" + npa + "' GROUP BY npanxx";
		connector.ctPool.query(qry, function(err, data){
			res(data);
		});
	}
};

module.exports = geoLookups;
