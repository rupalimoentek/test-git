/*/*
 Dev: Yogesh Thombare
 Controller : Indicator controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	indicatorModel = require('../../models/indicatorModel'),
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

describe('Call Controller', function () {
 	var indicatorModelStub, req;
	// Start test cases for updateIndicator
	describe('when model returns success for updateIndicator', function(){
		before(function () {
			req = {id:1};
			indicatorModelStub = sinon.stub(indicatorModel, 'updateIndicators');
			foo = proxyquire('../../controllers/indicatorController', { indicatorModel: { updateIndicators: indicatorModelStub}});
			indicatorModelStub.yields(null,fakeData);
		});

		after(function () {
			indicatorModel.updateIndicators.restore();
		});

		it('updateIndicator returns success', function (done) {
			foo.updateIndicator(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for updateIndicator', function(){
		before(function () {
			req = {id:1};
			indicatorModelStub = sinon.stub(indicatorModel, 'updateIndicators');
			foo = proxyquire('../../controllers/indicatorController', { indicatorModel: { updateIndicators: indicatorModelStub}});
			indicatorModelStub.yields('error in query',{});
		});

		after(function () {
			indicatorModel.updateIndicators.restore();
		});

		it('updateIndicator returns error', function (done) {
			foo.updateIndicator(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for getInfo
});