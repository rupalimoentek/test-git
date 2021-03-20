/*/*
 Dev: Yogesh Thombare
 Controller : Tag controller 
*

var assert = require('assert')
	,request = require('request');

var port = 8000,
    testUrl = "http://localhost:8000",
    accessHeader = {
		'Content-Type': 'application/json',
		'Authorization': 'bearer fb143b1ee694fc23e503636f3735032814456c7ac8a52ee270341410e431a8edf300be50d2ca7984b9d8ab952429cb0a8330cf3946070f4d7c5d1578fc551461'
	};

describe("Response from GET /v1/tag/ouid/8/userAccess/7 URI", function () {
	// this.timeout(15000);
	var url = testUrl + "/v1/tag/ouid/8/userAccess/7";
	it("should return JSON containing status success", function (done) {
		var options = {
			url: url,
			headers: accessHeader
		};
		request(options, function(err, res, body) {
			console.log(res.body);
			var test = JSON.parse(res.body);
			assert.equal(test.status,"success" );
			// assert.equal(test.json[0].id,1 );
			done();
		});
	});
});

describe("Response from POST /v1/orgUnit URI", function () {
  var url = testUrl + "/v1/orgUnit";
  //console.log(url);

  xit("should return JSON containing status success", function (done) {

  var options = {
		url: url,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'bearer fb143b1ee694fc23e503636f3735032814456c7ac8a52ee270341410e431a8edf300be50d2ca7984b9d8ab952429cb0a8330cf3946070f4d7c5d1578fc551461'
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

describe("Response from PUT /v1/orgUnit URI", function () {
  var url = testUrl + "/v1/orgUnit";
  //console.log(url);

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
});
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	tagModel = require('../../models/tagModel'),
	ctTransactionModel = require('../../models/ctTransactionModel'),
	sinon = require("sinon"),
	assert =  require('assert'),
	ctrl = require('../../controllers/tagController'),
	foo,
	fakeData = [
        { 
            created_at: "Fri Apr 05 19:39:30 +0000 2013", 
            text: "tweet 1", 
            retweeted: false, 
            favorited: false, 
            user: { name: "name 1" }
        }, 
    ];

describe('tag Controller', function () {
 	var tagModelStub, req;
 	// Test cases for getByOuidAction
  	describe('when model returns success for getByOuidAction', function(){
		before(function () {
			tagModelStub = sinon.stub(tagModel, 'getByOuid');
			foo = proxyquire('../../controllers/tagController', { tagModel: { getByOuid: tagModelStub}});
			tagModelStub.withArgs(8,7).yields(null,fakeData);
		});

		after(function () {
			tagModel.getByOuid.restore();
		});

		it('getByOuidAction returns success', function (done) {
			foo.getByOuidAction(8,7, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error', function(){
		before(function () {
			tagModelStub = sinon.stub(tagModel, 'getByOuid');
			foo = proxyquire('../../controllers/tagController', { tagModel: { getByOuid: tagModelStub}});
			tagModelStub.withArgs(8,7).yields('org unit id is not available',{});
		});

		after(function () {
			tagModel.getByOuid.restore();
		});

		it('getByOuidAction returns error for getByOuidAction', function (done) {
			foo.getByOuidAction(8,7, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
	// End test cases for getByOuidAction

	// Start test cases for putDeleteAction
	describe('when model returns success for putDeleteAction', function(){
		before(function () {
			tagModelStub = sinon.stub(tagModel, 'deleteTag');
			req =  {body:{tag:{id:1}}}; 
			foo = proxyquire('../../controllers/tagController', { tagModel: { deleteTag: tagModelStub}});
			tagModelStub.yields(null,'Completed');
		});

		after(function () {
			tagModel.deleteTag.restore();
		});

		it('putDeleteAction returns success', function (done) {
			this.timeout(15000);
			foo.putDeleteAction(req, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for putDeleteAction', function(){
		before(function () {
			req =  {body:{tag:{id:1}}};
			tagModelStub = sinon.stub(tagModel, 'deleteTag');
			foo = proxyquire('../../controllers/tagController', { tagModel: { deleteTag: tagModelStub}});
			tagModelStub.yields('error on deleteTag model query',{});
		});

		after(function () {
			tagModel.deleteTag.restore();
		});

		it('putDeleteAction returns error', function (done) {
			this.timeout(15000);
			foo.putDeleteAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});

	// start test cases for postAction
	describe('when model returns success for postAction', function(){
		
		req = {body:{tag:{tag_name:"asdssdsdf",org_unit_id:1}}};
		before(function () {
			tagModelStub = sinon.stub(tagModel, 'create');
			foo = proxyquire('../../controllers/tagController', { tagModel: { create: tagModelStub}});
			// tagModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			tagModelStub.yields(null, JSON.stringify({tag_id: "288"}));
		});

		after(function () {
			tagModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for postAction', function(){
		req = {body:{tag:{tag_name:"asdssdsdf",org_unit_id:1}}};
		before(function () {
			tagModelStub = sinon.stub(tagModel, 'create');
			foo = proxyquire('../../controllers/tagController', { tagModel: { create: tagModelStub}});
			// tagModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			tagModelStub.yields('This Tag is already exists', {});
		});

		after(function () {
			tagModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
});