var assert = require('assert')
	,request = require('request');

var port = 8000,
    testUrl = "http://127.0.0.1:8000",
	token = null;

function getToken(err, res) {
	request.post(
	{ url: 'http://127.0.0.1:8000/v1/login',
	  headers:
	   { 'Content-Type': 'application/json' },
	  form:
	  { username: 'lmcsuper@logmycalls.com',
		password: 'j0hn1$b@w$' }
		}
	, function(err, res, body) {
		if(err) console.log(err);
		body = JSON.parse(body);
		res = body.token;
		//console.log(body.token);
	});
}

describe("Response from GET /v1/user/1 URI", function () {
  var url = testUrl + "/v1/user/1";
  //console.log(url);

  xit("should return JSON containing status success", function (done) {
  var options = {
		url: url,
		headers: {
			'Content-Type': 'application/json',
			'x-access-token': token
		}
	};
	getToken(err, function() {

	});
    request(options, function(err, res, body) {
		if(err) console.log(err);
		console.log(res.body);
		var test = JSON.parse(res.body);
		assert.equal(test.result,"success" );
        assert.equal(test.json[0].id,1 );
		done();
    });
  });
});
/*
describe("Response from POST /v1/user URI", function () {
  var url = testUrl + "/v1/user";

  xit("should return JSON containing status success", function (done) {
  var options = {
		url: url,
		headers: {
			'Content-Type': 'application/json',
			'x-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MjM2ODMxNzQyODIsInVzZXJpZCI6MSwib3VpZCI6MX0.Uf24Jz5iCW3VyQ-IE5OuZRHy5BKuGmlXt-fqQEaYJo4'
		},
		form: {
			"orgUnits":
				{
				  "name" : "Aaron Unit test",
				  "external_id" : "123433",
				  "parent_id" : "1",
				  "address" : "134 Main St.",
				  "city" : "Washington",
				  "state" : "UT"
				}
		}
	};
    request.post(options, function(err, res, body) {
		var test = JSON.parse(res.body);
		assert.equal(test.result,"success" );
		done();
    });
  });
});

describe("Response from PUT /v1/user URI", function () {
  var url = testUrl + "/v1/user";
  console.log(url);

  xit("should return JSON containing status success", function (done) {
  var options = {
		url: url,
		headers: {
			'Content-Type': 'application/json',
			'x-access-token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MjM2ODMxNzQyODIsInVzZXJpZCI6MSwib3VpZCI6MX0.Uf24Jz5iCW3VyQ-IE5OuZRHy5BKuGmlXt-fqQEaYJo4'
		},
		form: {
			"orgUnits":
				{
				  "id": 6,
				  "name" : "Aaron Unit Test"
				}
		}
	};
    request.put(options, function(err, res, body) {
		var test = JSON.parse(res.body);
		assert.equal(test.result,"success" );
		done();
    });
  });
});*/
