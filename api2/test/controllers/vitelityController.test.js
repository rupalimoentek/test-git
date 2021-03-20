/*/*
 Dev: Yogesh Thombare
 Controller : Vitelity controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	vitelityModel = require('../../models/vitelityModel'),
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

describe('Vitelity Controller', function () {
 	var vitelityModelStub, req;
	// Start test cases for rcStateAction
	describe('when model returns success for rcStateAction', function(){
		before(function () {
			vitelityModelStub = sinon.stub(vitelityModel, 'rcState');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { rcState: vitelityModelStub}});
			vitelityModelStub.withArgs(802,'UT').yields(null,fakeData);
		});

		after(function () {
			vitelityModel.rcState.restore();
		});

		it('rcStateAction returns success', function (done) {
			foo.rcStateAction(802,'UT',function(err, data){
				assert.equal(data, fakeData);
				done();
			});
		});
	});

	describe('when model returns error for rcStateAction', function(){
		before(function () {
			vitelityModelStub = sinon.stub(vitelityModel, 'rcState');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { rcState: vitelityModelStub}});
			vitelityModelStub.withArgs(802,'UT').yields('error in query',{});
		});

		after(function () {
			vitelityModel.rcState.restore();
		});

		it('rcStateAction returns error', function (done) {
			foo.rcStateAction(802,'UT', function(err, data){
				assert.equal(err, 'error in query');
				done();
			});
		});	
	});
	// end test cases for rcStateAction

	// Start test cases for npaAction
	describe('when model returns success for npaAction', function(){
		before(function () {
			vitelityModelStub = sinon.stub(vitelityModel, 'npa');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { npa: vitelityModelStub}});
			vitelityModelStub.withArgs(802).yields(null,fakeData);
		});

		after(function () {
			vitelityModel.npa.restore();
		});

		it('npaAction returns success', function (done) {
			foo.npaAction(802,function(err, data){
				assert.equal(data, fakeData);
				done();
			});
		});
	});

	describe('when model returns error for npaAction', function(){
		before(function () {
			vitelityModelStub = sinon.stub(vitelityModel, 'npa');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { npa: vitelityModelStub}});
			vitelityModelStub.withArgs(802).yields('error in query',{});
		});

		after(function () {
			vitelityModel.npa.restore();
		});

		it('npaAction returns error', function (done) {
			foo.npaAction(802, function(err, data){
				assert.equal(err, 'error in query');
				done();
			});
		});	
	});
	// end test cases for npaAction

	// Start test cases for npanxxAction
	describe('when model returns success for npanxxAction', function(){
		before(function () {
			vitelityModelStub = sinon.stub(vitelityModel, 'npanxx');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { npanxx: vitelityModelStub}});
			vitelityModelStub.withArgs(802).yields(null,fakeData);
		});

		after(function () {
			vitelityModel.npanxx.restore();
		});

		it('npanxxAction returns success', function (done) {
			foo.npanxxAction(802,function(err, data){
				assert.equal(data, fakeData);
				done();
			});
		});
	});

	describe('when model returns error for npanxxAction', function(){
		before(function () {
			vitelityModelStub = sinon.stub(vitelityModel, 'npanxx');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { npanxx: vitelityModelStub}});
			vitelityModelStub.withArgs(802).yields('error in query',{});
		});

		after(function () {
			vitelityModel.npanxx.restore();
		});

		it('npanxxAction returns error', function (done) {
			foo.npanxxAction(802, function(err, data){
				assert.equal(err, 'error in query');
				done();
			});
		});	
	});
	// end test cases for npanxxAction

	// Start test cases for orderAction
	describe('when model returns success for orderAction', function(){
		before(function () {
			req = {body:{did:'45454545454'}};
			vitelityModelStub = sinon.stub(vitelityModel, 'orderNumber');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { orderNumber: vitelityModelStub}});
			vitelityModelStub.yields(null,fakeData);
		});

		after(function () {
			vitelityModel.orderNumber.restore();
		});

		it('orderAction returns success', function (done) {
			foo.orderAction(req,function(err, data){
				assert.equal(data, fakeData);
				done();
			});
		});
	});

	describe('when model returns error for orderAction', function(){
		before(function () {
			req = {body:{did:'45454545454'}};
			vitelityModelStub = sinon.stub(vitelityModel, 'orderNumber');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { orderNumber: vitelityModelStub}});
			vitelityModelStub.yields('error in query',{});
		});

		after(function () {
			vitelityModel.orderNumber.restore();
		});

		it('orderAction returns error', function (done) {
			foo.orderAction(req, function(err, data){
				assert.equal(err, 'error in query');
				done();
			});
		});	
	});
	// end test cases for orderAction

	// Start test cases for removeAction
	describe('when model returns success for removeAction', function(){
		before(function () {
			req = {body:{did:'45454545454'}};
			vitelityModelStub = sinon.stub(vitelityModel, 'removeNumber');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { removeNumber: vitelityModelStub}});
			vitelityModelStub.yields(null,fakeData);
		});

		after(function () {
			vitelityModel.removeNumber.restore();
		});

		it('removeAction returns success', function (done) {
			foo.removeAction(req,function(err, data){
				assert.equal(data, fakeData);
				done();
			});
		});
	});

	describe('when model returns error for removeAction', function(){
		before(function () {
			req = {body:{did:'45454545454'}};
			vitelityModelStub = sinon.stub(vitelityModel, 'removeNumber');
			foo = proxyquire('../../controllers/vitelityController', { vitelityModel: { removeNumber: vitelityModelStub}});
			vitelityModelStub.yields('error in query',{});
		});

		after(function () {
			vitelityModel.removeNumber.restore();
		});

		it('removeAction returns error', function (done) {
			foo.removeAction(req, function(err, data){
				assert.equal(err, 'error in query');
				done();
			});
		});	
	});
	// end test cases for removeAction
});