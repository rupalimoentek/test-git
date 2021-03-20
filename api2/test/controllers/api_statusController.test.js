/*/*
 Dev: Yogesh Thombare
 Controller : api_statusController controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	api_statusModel = require('../../models/api_statusModel'),
	controller = require('../../controllers/appController'),
	sinon = require("sinon"),
	assert =  require('assert'),
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

describe('Call Flow Controller', function () {
 	var api_statusModelStub, req;
	// Start test cases for getStatus
	describe('when model returns success for getStatus', function(){
		before(function () {
			api_statusModelStub = sinon.stub(api_statusModel, 'getStatus');
			req = {};
			foo = proxyquire('../../controllers/api_statusController', { api_statusModel: { getStatus: api_statusModelStub}});
			api_statusModelStub.yields(null,fakeData);
		});

		after(function () {
			api_statusModel.getStatus.restore();
		});

		it('getStatus returns success', function (done) {
			foo.getStatus(req, function(err, data){
				assert.equal(err, null);
				done();
			});
		});
	});

	describe('when model returns error for getStatus', function(){
		before(function () {
			req = {};
			api_statusModelStub = sinon.stub(api_statusModel, 'getStatus');
			foo = proxyquire('../../controllers/api_statusController', { api_statusModel: { getStatus: api_statusModelStub}});
			api_statusModelStub.yields('error on getStatus model query',{});
		});

		after(function () {
			api_statusModel.getStatus.restore();
		});

		it('getStatus returns error', function (done) {
			foo.getStatus(req, function(err, data){
				assert.equal(err, 'error on getStatus model query');
				done();
			});
		});	
	});
});