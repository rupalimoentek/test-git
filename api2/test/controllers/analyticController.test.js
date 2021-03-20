/*/*
 Dev: Yogesh Thombare
 Controller : Analytics controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	analyticModel = require('../../models/analyticModel'),
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

describe('Analytics Controller', function () {
 	var analyticModelStub, req;
 	// Test cases for getByOuidAction
  	describe('when model returns success for getByOuidAction with includeParentAnalytics on', function(){
		before(function () {
			analyticModelStub = sinon.stub(analyticModel, 'getByOuAndParentSetting');
			foo = proxyquire('../../controllers/analyticController', { analyticModel: { getByOuAndParentSetting: analyticModelStub}});
			analyticModelStub.yields(null,fakeData);
		});

		after(function () {
			analyticModel.getByOuAndParentSetting.restore();
		});

		it('getByOuidAction returns success', function (done) {
			foo.getByOuidAction(8,'true', function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getByOuidAction with includeParentAnalytics on', function(){
		before(function () {
			analyticModelStub = sinon.stub(analyticModel, 'getByOuAndParentSetting');
			foo = proxyquire('../../controllers/analyticController', { analyticModel: { getByOuAndParentSetting: analyticModelStub}});
			analyticModelStub.yields('Error in update',{});
		});

		after(function () {
			analyticModel.getByOuAndParentSetting.restore();
		});

		it('getByOuidAction returns error for getByOuidAction', function (done) {
			foo.getByOuidAction(8,'true', function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});

	describe('when model returns success for getByOuidAction with includeParentAnalytics off', function(){
		before(function () {
			analyticModelStub = sinon.stub(analyticModel, 'getByOuid');
			foo = proxyquire('../../controllers/analyticController', { analyticModel: { getByOuid: analyticModelStub}});
			analyticModelStub.yields(null,fakeData);
		});

		after(function () {
			analyticModel.getByOuid.restore();
		});

		it('getByOuidAction returns success', function (done) {
			foo.getByOuidAction(8,'false', function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getByOuidAction with includeParentAnalytics off', function(){
		before(function () {
			analyticModelStub = sinon.stub(analyticModel, 'getByOuid');
			foo = proxyquire('../../controllers/analyticController', { analyticModel: { getByOuid: analyticModelStub}});
			analyticModelStub.yields('Error in update',{});
		});

		after(function () {
			analyticModel.getByOuid.restore();
		});

		it('getByOuidAction returns error for getByOuidAction', function (done) {
			foo.getByOuidAction(8,'false', function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
	// End test cases for getByOuidAction

	// Start test cases for putAction
	describe('when model returns success for putAction', function(){
		before(function () {
			analyticModelStub = sinon.stub(analyticModel, 'update');
			req = {body:{analytic:{org_unit_id:1}}};
			foo = proxyquire('../../controllers/analyticController', { analyticModel: { update: analyticModelStub}});
			analyticModelStub.yields(null,'Updated');
		});

		after(function () {
			analyticModel.update.restore();
		});

		it('putAction returns success', function (done) {
			foo.putAction(req, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for putAction', function(){
		before(function () {
			req = {body:{analytic:{org_unit_id:1}}};
			analyticModelStub = sinon.stub(analyticModel, 'update');
			foo = proxyquire('../../controllers/analyticController', { analyticModel: { update: analyticModelStub}});
			analyticModelStub.yields('error on update model query',{});
		});

		after(function () {
			analyticModel.update.restore();
		});

		it('putAction returns error', function (done) {
			foo.putAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});

	// start test cases for postAction
	describe('when model returns success for postAction', function(){
		
		req = {body:{analytic:{org_unit_id:1}}};
		before(function () {
			analyticModelStub = sinon.stub(analyticModel, 'create');
			foo = proxyquire('../../controllers/analyticController', { analyticModel: { create: analyticModelStub}});
			// analyticModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			analyticModelStub.yields(null, 'analytic created');
		});

		after(function () {
			analyticModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for postAction', function(){
		req = {body:{analytic:{org_unit_id:1}}};
		before(function () {
			analyticModelStub = sinon.stub(analyticModel, 'create');
			foo = proxyquire('../../controllers/analyticController', { analyticModel: { create: analyticModelStub}});
			// analyticModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			analyticModelStub.yields('Error in inserting record', {});
		});

		after(function () {
			analyticModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
});