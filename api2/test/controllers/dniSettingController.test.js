/*/*
 Dev: Yogesh Thombare
 Controller : dniSetting controller 
*/
"use_strict";
var proxyquire =  require('proxyquire'),
	dniSettingModel = require('../../models/dniSettingModel'),
	appModel = require('../../models/appModel'),
	controller = require('../../controllers/appController'),
	sinon = require("sinon"),
	assert =  require('assert'),
	foo,
	fakeData = [
        { 
            created_at: "Fri Apr 05 19:39:30 +0000 2013", 
        }, 
    ];

describe('Dni Setting Controller', function () {
 	var dniSettingModelStub, req;
	// Start test cases for postAction
	describe('when model returns success for postAction', function(){
		before(function () {
			dniSettingModelStub = sinon.stub(dniSettingModel, 'create');
			req = {body : {dniSetting:{dniid:1} }};
			foo = proxyquire('../../controllers/dniSettingController', { dniSettingModel: { create: dniSettingModelStub}});
			dniSettingModelStub.yields(null,'created successfully');
		});

		after(function () {
			dniSettingModel.create.restore();
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
			req = {body : {dniSetting:{dniid:1} }};
			dniSettingModelStub = sinon.stub(dniSettingModel, 'create');
			foo = proxyquire('../../controllers/dniSettingController', { dniSettingModel: { create: dniSettingModelStub}});
			dniSettingModelStub.yields('error on create model query',{});
		});

		after(function () {
			dniSettingModel.create.restore();
		});

		it('postAction returns error', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});

	// start test cases for putAction
	describe('when model returns success for putAction', function(){
		
		req = {body : {dniSetting:{dniid:1} }};
		before(function () {
			dniSettingModelStub = sinon.stub(dniSettingModel, 'updateDNISetting');
			foo = proxyquire('../../controllers/dniSettingController', { dniSettingModel: { updateDNISetting: dniSettingModelStub}});
			// dniSettingModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			dniSettingModelStub.yields(null, 'Updated successfully');
		});

		after(function () {
			dniSettingModel.updateDNISetting.restore();
		});

		it('putAction returns success', function (done) {
			foo.putAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for putAction', function(){
		req = {body : {dniSetting:{dniid:1} }};
		before(function () {
			dniSettingModelStub = sinon.stub(dniSettingModel, 'updateDNISetting');
			foo = proxyquire('../../controllers/dniSettingController', { dniSettingModel: { updateDNISetting: dniSettingModelStub}});
			dniSettingModelStub.yields('Error in updating record', {});
		});

		after(function () {
			dniSettingModel.updateDNISetting.restore();
		});

		it('putAction returns success', function (done) {
			foo.putAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
	// end test cases for putAction
	// start test cases for getAction
	describe('when model returns success for getAction', function(){
		req = {ouid : 1, prov_id: 1};
		before(function () {
			dniSettingModelStub = sinon.stub(dniSettingModel, 'read');
			foo = proxyquire('../../controllers/dniSettingController', { dniSettingModel: { read: dniSettingModelStub}});
			// dniSettingModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			dniSettingModelStub.withArgs(req.ouid,req.prov_id).yields(null, fakeData);
		});

		after(function () {
			dniSettingModel.read.restore();
		});

		it('getAction returns success', function (done) {
			foo.getAction(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getAction', function(){
		req = {ouid : 1, prov_id: 1};
		before(function () {
			dniSettingModelStub = sinon.stub(dniSettingModel, 'read');
			foo = proxyquire('../../controllers/dniSettingController', { dniSettingModel: { read: dniSettingModelStub}});
			dniSettingModelStub.withArgs(req.ouid,req.prov_id).yields('Error in query', {});
		});

		after(function () {
			dniSettingModel.read.restore();
		});

		it('getAction returns success', function (done) {
			foo.getAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
	// end test cases for getAction
	// start test cases for deleteAction
	describe('when model returns success for deleteAction', function(){
		before(function () {
			dniSettingModelStub = sinon.stub(dniSettingModel, 'deleteDNISetting');
			foo = proxyquire('../../controllers/dniSettingController', { dniSettingModel: { deleteDNISetting: dniSettingModelStub}});
			// dniSettingModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			dniSettingModelStub.withArgs(1).yields(null, fakeData);
		});

		after(function () {
			dniSettingModel.deleteDNISetting.restore();
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
			dniSettingModelStub = sinon.stub(dniSettingModel, 'deleteDNISetting');
			foo = proxyquire('../../controllers/dniSettingController', { dniSettingModel: { deleteDNISetting: dniSettingModelStub}});
			dniSettingModelStub.withArgs(1).yields('Error in query', {});
		});

		after(function () {
			dniSettingModel.deleteDNISetting.restore();
		});

		it('deleteAction returns success', function (done) {
			foo.deleteAction(1, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
});