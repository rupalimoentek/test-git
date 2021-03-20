/*/*
 Dev: Yogesh Thombare
 Controller : dniOrgUnit controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	dniOrgUnitModel = require('../../models/dniOrgUnitModel'),
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
 	var dniOrgUnitModelStub, req;
	// Start test cases for postAction
	describe('when model returns success for postAction', function(){
		before(function () {
			dniOrgUnitModelStub = sinon.stub(dniOrgUnitModel, 'create');
			req = {body : {dniOrgUnit:{dniid:1} }};
			foo = proxyquire('../../controllers/dniOrgUnitController', { dniOrgUnitModel: { create: dniOrgUnitModelStub}});
			dniOrgUnitModelStub.yields(null,'created successfully');
		});

		after(function () {
			dniOrgUnitModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for postAction', function(){
		before(function () {
			req = {body : {dniOrgUnit:{dniid:1} }};
			dniOrgUnitModelStub = sinon.stub(dniOrgUnitModel, 'create');
			foo = proxyquire('../../controllers/dniOrgUnitController', { dniOrgUnitModel: { create: dniOrgUnitModelStub}});
			dniOrgUnitModelStub.yields('error on create model query',{});
		});

		after(function () {
			dniOrgUnitModel.create.restore();
		});

		it('postAction returns error', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});

	// start test cases for getLocationAction
	describe('when model returns success for putAction', function(){
		
		req = {body : {dniOrgUnit:{dniid:1} }};
		before(function () {
			dniOrgUnitModelStub = sinon.stub(dniOrgUnitModel, 'update');
			foo = proxyquire('../../controllers/dniOrgUnitController', { dniOrgUnitModel: { update: dniOrgUnitModelStub}});
			// dniOrgUnitModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			dniOrgUnitModelStub.yields(null, 'error while inserting record');
		});

		after(function () {
			dniOrgUnitModel.update.restore();
		});

		it('putAction returns success', function (done) {
			foo.putAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for putAction', function(){
		req = {body : {dniOrgUnit:{dniid:1} }};
		before(function () {
			dniOrgUnitModelStub = sinon.stub(dniOrgUnitModel, 'update');
			foo = proxyquire('../../controllers/dniOrgUnitController', { dniOrgUnitModel: { update: dniOrgUnitModelStub}});
			dniOrgUnitModelStub.yields('Error in query', {});
		});

		after(function () {
			dniOrgUnitModel.update.restore();
		});

		it('putAction returns success', function (done) {
			foo.putAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
});