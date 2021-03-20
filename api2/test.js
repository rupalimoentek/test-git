/**
 * Created by davey on 3/8/16.
 */
//var token = require('./lib/token');
var moment = require('moment');

var date1 = moment().startOf('day');
var date2 = moment().subtract(1, 'month').endOf('month').endOf('day');
console.log('date2', date2, 'date1', date1);

/*var Memcached           = require('memcached'),
    fs                  = require('fs'),
    yaml                = require('js-yaml'),
    conf                = yaml.load(fs.readFileSync('config/config.yml')),
    envVar              = process.env.NODE_ENV,
    //uuid                = require('node-uuid'),
	async               = require('async');

var memcached   = new Memcached(conf[envVar].memcached.server+':'+conf[envVar].memcached.port, {retries:10, retry:10000});
var data = JSON.stringify({mydata:2354,somemore:"asdfasdf"});
var guid = ''; //uuid.v4();
var type = 'access_token-';


for (var n=1; n<100000; n++) {
	var uuid = require('node-uuid');
	guid = uuid.v4();
	//console.log(guid);
	memcached.set(type + guid, data, 10800, function (err) {
		if (err) {
			console.log('Failed to insert', guid);
		} else {
			console.log(guid);
		}
	});
}
/*
guid = uuid.v4();
memcached.set(type + guid, data, 10800, function (err) {
	if (err) {
		console.log('Failed to insert', guid);
	} else {
		console.log(guid);
	}
});

/*
var run = true;
var guid = uuid.v4();
var type = 'access_token-';

async.whilst(
	function() { return run; },
	function(cb) {
		guid = uuid.v4();
		memcached.get(type+guid, function(err, ret) {
			if (err) {
				console.log('Got an error ', err);
				return cb('An error occurred. '+err); }
			console.log('return', ret);
			if (ret === undefined) {
				console.log('hit stop point', guid);
				run = false;
				cb(null, guid);
			}
			//cb(null);
		});
	},
	function(err, uid) {
		if (err) { console.log("ERROR: ", err); }
		console.log('UID', uid, guid);
	}
);


/*function getUid(check) {
	type = 'access_token-';
	guid = uuid.v4();
	return check().then(function () {
		return getUid(check);
	});
}

function check() {
	memcached.get(type+guid, function(err, ret) {
		if (err) { return 'An error occurred. '+err; }
		console.log('return', ret);
		if (ret === undefined) {
			console.log('hit stop point');
			return guid; }
		return false;
	});
}

var uid = getUid(check).then(undefined, console.error);
console.log('UID', uid);


/*var type = 'access_token-';
var guid = uuid.v4();
q.until(function() {
	guid = uuid.v4();
	return q.fcall(
		memcached.get(type+guid, function(err, ret) {
			if (err) { return 'An error occurred. '+err; }
			console.log('return', ret);
			if (ret === undefined) {
				console.log('hit stop point');
				return guid; }
			return false;
		})
	);
}).done(function() {
	console.log('Final GUID', guid);
	return guid;
});



//var uid = token.getToken('access');
//console.log('access token', uid);

/*function seedLoop(seed, taskFn) {
  const seedPromise = Promise.resolve(seed);

  return seedPromise
    .then(taskFn)
    .then((wrapper) => {
      if (wrapper.done) {
        return wrapper.seed;
      }

      return seedLoop(wrapper.seed, taskFn);
    });
}

// A super simple example of counting to ten, which doesn't even
// do anything asynchronous, but if it did, it should resolve to
// a promise that returns the { done, seed } wrapper object for the
// next call of the countToTen task function.
function countToTen(count) {
  const done = count > 10;
  const seed = done ? count : count + 1;

  return {done, seed};
}

seedLoop(1, countToTen).then((result) => {
  console.log(result); // 11, the first value which was over 10.
});

*/
