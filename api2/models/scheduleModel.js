var connector = require('./appModel'),
	table = 'schedule';

var schedule = {
	create: function(data, res){
		var schedule_data = {
			table : table,
			values: data
		};
		connector.csPool.insert(schedule_data, function(err, data){
			res(err, data);
		});
	},
	update: function(data, res){
		var schedule_data = {
			table : table,
			values: data,
			where: " WHERE reference_id = " + data.id + " AND task_data = '" + data.task_data + "'"
		};
		connector.csPool.update(schedule_data, function(err, data){
			if (data.rowCount === 0) {
				var values = schedule_data.values;
				values.reference_id = values.id;
				delete values.id;
				connector.csPool.insert(schedule_data, function(err, data){
					res(err,data);
				});
			} else {
				res(err, data);
			}
		});
	},
	delete: function(data, res){ // function remove call flows from schedular if campaign is archieved.
		if(data.length > 0) {
			var qry = "DELETE from "+table+ " WHERE reference_id IN ("+ data +")"; 
			connector.csPool.query(qry, function(err, data){
				res(err, data);
			});
		} else {
			res(null);
		}
	}
};

module.exports = schedule;