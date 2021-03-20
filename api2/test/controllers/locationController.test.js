/*/*
 Dev: Yogesh Thombare
 Controller : Location controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	locationModel = require('../../models/locationModel'),
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

describe('Location Controller', function () {
 	var locationModelStub, req;
	// Start test cases for getByIdAction
	describe('when model returns success for getByIdAction', function(){
		before(function () {
			locationModelStub = sinon.stub(locationModel, 'getById');
			foo = proxyquire('../../controllers/locationController', { locationModel: { getById: locationModelStub}});
			locationModelStub.withArgs(1).yields(null,fakeData);
		});

		after(function () {
			locationModel.getById.restore();
		});

		it('getByIdAction returns success', function (done) {
			foo.getByIdAction(1,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getByIdAction', function(){
		before(function () {
			locationModelStub = sinon.stub(locationModel, 'getById');
			foo = proxyquire('../../controllers/locationController', { locationModel: { getById: locationModelStub}});
			locationModelStub.withArgs(1).yields('error in query',{});
		});

		after(function () {
			locationModel.getById.restore();
		});

		it('getByIdAction returns error', function (done) {
			foo.getByIdAction(1, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for getByIdAction

	// start test cases for getByOuidAction
	describe('when model returns success for getByOuidAction', function(){
		before(function () {
			req = {id:1};
			locationModelStub = sinon.stub(locationModel, 'getByOuid');
			foo = proxyquire('../../controllers/locationController', { locationModel: { getByOuid: locationModelStub}});
			locationModelStub.yields(null,fakeData);
		});

		after(function () {
			locationModel.getByOuid.restore();
		});

		it('getByOuidAction returns success', function (done) {
			foo.getByOuidAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getByOuidAction', function(){
		before(function () {
			req = {id:1};
			locationModelStub = sinon.stub(locationModel, 'getByOuid');
			foo = proxyquire('../../controllers/locationController', { locationModel: { getByOuid: locationModelStub}});
			locationModelStub.yields('error in query',{});
		});

		after(function () {
			locationModel.getByOuid.restore();
		});

		it('getByOuidAction returns error', function (done) {
			foo.getByOuidAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for getByOuidAction

		// start test cases for getByOuidAction1
	describe('when model returns success for getByOuidAction1', function(){
		before(function () {
			req = {id:1};
			locationModelStub = sinon.stub(locationModel, 'getByOuid1');
			foo = proxyquire('../../controllers/locationController', { locationModel: { getByOuid1: locationModelStub}});
			locationModelStub.yields(null,fakeData);
		});

		after(function () {
			locationModel.getByOuid1.restore();
		});

		it('getByOuidAction1 returns success', function (done) {
			foo.getByOuidAction1(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getByOuidAction1', function(){
		before(function () {
			req = {id:1};
			locationModelStub = sinon.stub(locationModel, 'getByOuid1');
			foo = proxyquire('../../controllers/locationController', { locationModel: { getByOuid1: locationModelStub}});
			locationModelStub.yields('error in query',{});
		});

		after(function () {
			locationModel.getByOuid1.restore();
		});

		it('getByOuidAction1 returns error', function (done) {
			foo.getByOuidAction1(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for getByOuidAction1

	// start test cases for createAction
	describe('when model returns success for createAction', function(){
		before(function () {
			req = {body: {id:1}};
			locationModelStub = sinon.stub(locationModel, 'create');
			foo = proxyquire('../../controllers/locationController', { locationModel: { create: locationModelStub}});
			locationModelStub.yields(null,'Created successfully');
		});

		after(function () {
			locationModel.create.restore();
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
			req = {body: {id:1}};
			locationModelStub = sinon.stub(locationModel, 'create');
			foo = proxyquire('../../controllers/locationController', { locationModel: { create: locationModelStub}});
			locationModelStub.yields('error in query',{});
		});

		after(function () {
			locationModel.create.restore();
		});

		it('createAction returns error', function (done) {
			foo.createAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for createAction

	// start test cases for updateAction
	describe('when model returns success for updateAction', function(){
		before(function () {
			req = {body: {id:1}};
			locationModelStub = sinon.stub(locationModel, 'update');
			foo = proxyquire('../../controllers/locationController', { locationModel: { update: locationModelStub}});
			locationModelStub.yields(null,'Updated successfully');
		});

		after(function () {
			locationModel.update.restore();
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
			req = {body: {id:1}};
			locationModelStub = sinon.stub(locationModel, 'update');
			foo = proxyquire('../../controllers/locationController', { locationModel: { update: locationModelStub}});
			locationModelStub.yields('error in query',{});
		});

		after(function () {
			locationModel.update.restore();
		});

		it('updateAction returns error', function (done) {
			foo.updateAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for updateAction

	// start test cases for deleteAction
	describe('when model returns success for deleteAction', function(){
		before(function () {
			req = {body: {id:1}};
			locationModelStub = sinon.stub(locationModel, 'delete');
			foo = proxyquire('../../controllers/locationController', { locationModel: { delete: locationModelStub}});
			locationModelStub.yields(null,'Commment added successfully');
		});

		after(function () {
			locationModel.delete.restore();
		});

		it('deleteAction returns success', function (done) {
			foo.deleteAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for deleteAction', function(){
		before(function () {
			req = {body: {id:1}};
			locationModelStub = sinon.stub(locationModel, 'delete');
			foo = proxyquire('../../controllers/locationController', { locationModel: { delete: locationModelStub}});
			locationModelStub.yields('error in query',{});
		});

		after(function () {
			locationModel.delete.restore();
		});

		it('deleteAction returns error', function (done) {
			foo.deleteAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for deleteAction

	// start test cases for deleteLocationAction
	describe('when model returns success for deleteLocationAction', function(){
		before(function () {
			locationModelStub = sinon.stub(locationModel, 'delete_location');
			foo = proxyquire('../../controllers/locationController', { locationModel: { delete_location: locationModelStub}});
			locationModelStub.withArgs(1).yields(null,'Tag added successfully');
		});

		after(function () {
			locationModel.delete_location.restore();
		});

		it('deleteLocationAction returns success', function (done) {
			foo.deleteLocationAction(1,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for deleteLocationAction', function(){
		before(function () {
			locationModelStub = sinon.stub(locationModel, 'delete_location');
			foo = proxyquire('../../controllers/locationController', { locationModel: { delete_location: locationModelStub}});
			locationModelStub.withArgs(1).yields('error in query',{});
		});

		after(function () {
			locationModel.delete_location.restore();
		});

		it('deleteLocationAction returns error', function (done) {
			foo.deleteLocationAction(1, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for deleteLocationAction
});