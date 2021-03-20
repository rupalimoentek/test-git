/*/*
 Dev: Yogesh Thombare
 Controller : Location Route controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	locationRouteModel = require('../../models/locationRouteModel'),
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

describe('Location Route Controller', function () {
 	var locationRouteModelStub, req;
	// Start test cases for createAction
	describe('when model returns success for createAction', function(){
		before(function () {
			req = {body : {id:1}};
			locationRouteModelStub = sinon.stub(locationRouteModel, 'create');
			foo = proxyquire('../../controllers/locationRouteController', { locationRouteModel: { create: locationRouteModelStub}});
			locationRouteModelStub.yields(null,fakeData);
		});

		after(function () {
			locationRouteModel.create.restore();
		});

		it('createAction returns success', function (done) {
			foo.createAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for createAction', function(){
		before(function () {
			req = {body : {id:1}};
			locationRouteModelStub = sinon.stub(locationRouteModel, 'create');
			foo = proxyquire('../../controllers/locationRouteController', { locationRouteModel: { create: locationRouteModelStub}});
			locationRouteModelStub.yields('error in query',{});
		});

		after(function () {
			locationRouteModel.create.restore();
		});

		it('createAction returns error', function (done) {
			foo.createAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for createAction

	// Start test cases for updateAction
	describe('when model returns success for updateAction', function(){
		before(function () {
			req = {body : {id:1}};
			locationRouteModelStub = sinon.stub(locationRouteModel, 'update');
			foo = proxyquire('../../controllers/locationRouteController', { locationRouteModel: { update: locationRouteModelStub}});
			locationRouteModelStub.yields(null,fakeData);
		});

		after(function () {
			locationRouteModel.update.restore();
		});

		it('updateAction returns success', function (done) {
			foo.updateAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for updateAction', function(){
		before(function () {
			req = {body : {id:1}};
			locationRouteModelStub = sinon.stub(locationRouteModel, 'update');
			foo = proxyquire('../../controllers/locationRouteController', { locationRouteModel: { update: locationRouteModelStub}});
			locationRouteModelStub.yields('error in query',{});
		});

		after(function () {
			locationRouteModel.update.restore();
		});

		it('updateAction returns error', function (done) {
			foo.updateAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for updateAction

	// Start test cases for deleteAction
	describe('when model returns success for deleteAction', function(){
		before(function () {
			locationRouteModelStub = sinon.stub(locationRouteModel, 'delete');
			foo = proxyquire('../../controllers/locationRouteController', { locationRouteModel: { delete: locationRouteModelStub}});
			locationRouteModelStub.withArgs(1).yields(null,fakeData);
		});

		after(function () {
			locationRouteModel.delete.restore();
		});

		it('deleteAction returns success', function (done) {
			foo.deleteAction(1,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for deleteAction', function(){
		before(function () {
			locationRouteModelStub = sinon.stub(locationRouteModel, 'delete');
			foo = proxyquire('../../controllers/locationRouteController', { locationRouteModel: { delete: locationRouteModelStub}});
			locationRouteModelStub.withArgs(1).yields('error in query',{});
		});

		after(function () {
			locationRouteModel.delete.restore();
		});

		it('deleteAction returns error', function (done) {
			foo.deleteAction(1, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for deleteAction

	// Start test cases for importAction
	describe('when model returns success for importAction', function(){
		before(function () {
			req = {body: {location_id:1},files: { file: {name:'bWyRbt1h_1436988121926.csv'}}};
			locationRouteModelStub = sinon.stub(locationRouteModel, 'import');
			foo = proxyquire('../../controllers/locationRouteController', { locationRouteModel: { import: locationRouteModelStub}});
			locationRouteModelStub.yields(null,fakeData);
		});

		after(function () {
			locationRouteModel.import.restore();
		});

		it('importAction returns success', function (done) {
			foo.importAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for importAction', function(){
		before(function () {
			req = {body: {location_id:1},files: { file: {name:'bWyRbt1h_1436988121926.csv'}}};
			locationRouteModelStub = sinon.stub(locationRouteModel, 'import');
			foo = proxyquire('../../controllers/locationRouteController', { locationRouteModel: { import: locationRouteModelStub}});
			locationRouteModelStub.yields('error in query',{});
		});

		after(function () {
			locationRouteModel.import.restore();
		});

		it('importAction returns error', function (done) {
			foo.importAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for importAction

});