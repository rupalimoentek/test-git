/*/*
 Dev: Yogesh Thombare
 Controller : callFlows controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	callFlowModel = require('../../models/callFlowModel'),
	controller = require('../../controllers/appController'),
	orgUnitModel = require('../../models/orgUnitModel'),
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
 	var callFlowModelStub, req;
	// Start test cases for getByProvisionedRouteAction
	describe('when model returns success for getByProvisionedRouteAction', function(){
		before(function () {
			callFlowModelStub = sinon.stub(callFlowModel, 'getByProvisionedRoute');
			req = {};
			foo = proxyquire('../../controllers/callFlowController', { callFlowModel: { getByProvisionedRoute: callFlowModelStub}});
			callFlowModelStub.yields(null,fakeData);
		});

		after(function () {
			callFlowModel.getByProvisionedRoute.restore();
		});

		it('getByProvisionedRouteAction returns success', function (done) {
			foo.getByProvisionedRouteAction(req,1, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getByProvisionedRouteAction', function(){
		before(function () {
			req = {};
			callFlowModelStub = sinon.stub(callFlowModel, 'getByProvisionedRoute');
			foo = proxyquire('../../controllers/callFlowController', { callFlowModel: { getByProvisionedRoute: callFlowModelStub}});
			callFlowModelStub.yields('error on getByProvisionedRoute model query',{});
		});

		after(function () {
			callFlowModel.getByProvisionedRoute.restore();
		});

		it('getByProvisionedRouteAction returns error', function (done) {
			foo.getByProvisionedRouteAction(req,1, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});

	// start test cases for getLocationAction
	describe('when model returns success for getLocationAction', function(){
		
		req = {};
		before(function () {
			callFlowModelStub = sinon.stub(orgUnitModel, 'ouLocations');
			foo = proxyquire('../../controllers/callFlowController', { orgUnitModel: { ouLocations: callFlowModelStub}});
			// callFlowModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			callFlowModelStub.yields(null, fakeData);
		});

		after(function () {
			orgUnitModel.ouLocations.restore();
		});

		it('getLocationAction returns success', function (done) {
			foo.getLocationAction(req,1, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getLocationAction', function(){
		req = {};
		before(function () {
			callFlowModelStub = sinon.stub(orgUnitModel, 'ouLocations');
			foo = proxyquire('../../controllers/callFlowController', { orgUnitModel: { ouLocations: callFlowModelStub}});
			callFlowModelStub.yields('Error in query', {});
		});

		after(function () {
			orgUnitModel.ouLocations.restore();
		});

		it('getLocationAction returns success', function (done) {
			foo.getLocationAction(req,1, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
});