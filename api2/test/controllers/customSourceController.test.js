"use_strict";
var proxyquire =  require('proxyquire'),
	customSourceModel = require('../../models/customSourceModel'),
	customSourceController = require('../../controllers/customSourceController'),
	sinon = require("sinon"),
	assert =  require('assert'),
	foo,
	fakeData = [
        { 
            created_at: "Fri Apr 05 19:39:30 +0000 2013", 
            text: "tweet 1",  
            user: { name: "name 1" }
        }, 
    ];

describe('Custom Source Controller', function () {
 	var customSourceModelStub, req;    

 	// Start test cases for getByOuidAction
	describe('when model returns success for getByOuidAction', function(){
		before(function () {
			customSourceModelStub = sinon.stub(customSourceModel, 'getByOuid');
			foo = proxyquire('../../controllers/customSourceController', { customSourceModel: { getByOuid: customSourceModelStub}});
			customSourceModelStub.yields(null,fakeData);
		});

		after(function () {
			customSourceModel.getByOuid.restore();
		});

		it('getByOuidAction returns success', function (done) {
			foo.getByOuidAction(1,2,function(response){
				assert.equal(response.status, 'success');
				done();
			});
		});
	}); 

	describe('when model returns error for getByOuidAction', function(){
		before(function () {
			webhookModelStub = sinon.stub(customSourceModel, 'getByOuid');
			foo = proxyquire('../../controllers/customSourceController', { customSourceModel: { getByOuid: customSourceModelStub}});
			webhookModelStub.yields({
				result: 'error',
				err: 'error in Query model',
				json: {}
			});
		});

		after(function () {
			customSourceModel.getByOuid.restore();
		});

		it('getByOuidAction returns error', function (done) {
			foo.getByOuidAction(1,2,function(response){
				assert.equal(response.status, 'error');
				done();
			});
		});
	}); 
	// End test cases for getByOuidAction

	// Start test cases for postAction
	describe('when model returns success for postAction', function(){
		before(function () {
			req = { body : { customsource : 'abc'} };
			customSourceModelStub = sinon.stub(customSourceModel, 'create');
			foo = proxyquire('../../controllers/customSourceController', { customSourceModel: { create: customSourceModelStub}});
			customSourceModelStub.yields(null,fakeData);
		});

		after(function () {
			customSourceModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req,function(response){
				assert.equal(response.status, 'success');
				done();
			});
		});
	}); 

	describe('when model returns error for postAction', function(){
		before(function () {
			req = { body : { customsource : 'abc'} };
			webhookModelStub = sinon.stub(customSourceModel, 'create');
			foo = proxyquire('../../controllers/customSourceController', { customSourceModel: { create: customSourceModelStub}});
			webhookModelStub.yields({
				result: 'error',
				err: 'This Custom Source Tag is already exists',
				json: {}
			});
		});

		after(function () {
			customSourceModel.create.restore();
		});

		it('postAction returns error', function (done) {
			foo.postAction(req,function(response){
				assert.equal(response.status, 'error');
				done();
			});
		});
	}); 
	// End test cases for postAction

	// Start test cases for putDeleteAction
	describe('when model returns success for putDeleteAction', function(){
		before(function () {
			req = { body : { customSource : { id : 1 } } }; 
			customSourceModelStub = sinon.stub(customSourceModel, 'deleteCustomSource');
			foo = proxyquire('../../controllers/customSourceController', { customSourceModel: { deleteCustomSource: customSourceModelStub}});
			customSourceModelStub.yields(null, 'deleted successfully');
		});

		after(function () {
			customSourceModel.deleteCustomSource.restore();
		});

		it('putDeleteAction returns success', function (done) {
			foo.putDeleteAction(req,function(response){
				assert.equal(response.status, 'success');
				done();
			});
		});
	}); 

	describe('when model returns error for putDeleteAction', function(){
		before(function () {
			req = { body : { customSource : { id : 1 } } }; 
			customSourceModelStub = sinon.stub(customSourceModel, 'deleteCustomSource');
			foo = proxyquire('../../controllers/customSourceController', { customSourceModel: { deleteCustomSource: customSourceModelStub}});
			customSourceModelStub.yields('error in Query model', {});
		});

		after(function () {
			customSourceModel.deleteCustomSource.restore();
		});

		it('putDeleteAction returns error', function (done) {
			foo.putDeleteAction(req,function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	}); 
	// End test cases for putDeleteAction
}) 	