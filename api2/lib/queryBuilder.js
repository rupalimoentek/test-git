var query = {
	build: function(data, res){
		var qry = '';
		switch(data.which){
			case 'insert':
				var fields = [];
				var values = '';
				var count = 0;
				for (var key in data.values) {
					count ++;
					fields.push(key);
					if (typeof data.values[key] === 'string') {
						if (data.values[key] === 'CURRENT_TIMESTAMP' || data.values[key] === 'NULL' || data.values[key] === 'NOW()' || data.values[key] === 'NOT NULL') {
							values += data.values[key];
						} else {
							if ((data.values[key]).indexOf("'") > -1) { // add escape character to single quotes
								data.values[key] = (data.values[key]).replace(/'/g, "''");
							}
							values += "'" + data.values[key] + "'";
						}
					} else {
						values += data.values[key];
					}
					if (count < Object.keys(data.values).length) {
						values += ",";
					}
				}
				qry = "INSERT INTO " + data.table + " (" + fields.join(',') + ") VALUES (" + values + ")";
			break;

			case 'update':
				var set = [];
				for (var field in data.values) {
					if (field == data.table + '_id' || field == 'id') continue;
					var str = "";
					str += field + " = ";
					if (typeof data.values[field] === 'string') {
						if (data.values[key] === 'CURRENT_TIMESTAMP' || data.values[key] === 'NULL' || data.values[key] === 'NOW()' || data.values[key] === 'NOT NULL') {
							str += data.values[field];
						} else {
							if ((data.values[field]).indexOf("'") > -1) {
								data.values[field] = (data.values[field]).replace(/'/g, "''");
							}
							str += "'" + data.values[field] + "'";
						}
					} else {
						str += data.values[field];
					}
					set.push(str);
				}
				qry = "UPDATE " +  data.table + " SET " + set.join(',');
				if (data.where) qry += data.where;
				else qry += " WHERE " + data.table + "_id = " + data.values[data.table + '_id'];
			break;
			default:
				qry = "Invalid which";
		}
		return qry;
	}
};

module.exports = query;
