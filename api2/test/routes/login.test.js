//var expect = require("chai").expect;
var superReq = require("supertest"),
	app = require("../../app.js");

describe("POST login", function () {
	xit("should return JSON containing token with valid user", function (done) {
		superReq(app)
			.post("/v1/login")
			.field('username', 'lmcsuper@logmycalls.com')
			.field('password', 'j0hn1$b@w$')
			.expect(200)
			.end(function(err, res){
				if (err) return done(err);
				console.log('res body is '+JSON.stringify(res.body));
				should.exist(res.body.token);
				res.body.status.should.equal('success');
				res.body.result.should.equal('success');
				done();
			});
	});
	xit("should return result error when invalid password", function (done) {
		superReq(app)
			.post("/v1/login")
			.field('username', 'lmcsuper@logmycalls.com')
			.field('password', 'invalid')
			.expect(200)
			.end(function(err, res){
				if (err) return done(err);
				should.not.exist(res.body.token);
				res.body.status.should.equal('error');
				res.body.result.should.equal('error');
				done();
			});
	});
});