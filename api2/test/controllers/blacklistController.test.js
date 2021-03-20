/*/*
 Dev: Yogesh Thombare
 Controller : Blacklist controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	blacklistModel = require('../../models/blacklistModel'),
	// ceTransactionModel = require('../../models/ceTransactionModel'),
	sinon = require("sinon"),
	assert =  require('assert'),
	ctrl = require('../../controllers/blacklistController'),
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

describe('Blacklist Controller', function () {
 	var blacklistModelStub, req;
 	// Test cases for getByOuidAction
  	describe('when model returns success for getByOuidAction', function(){
		before(function () {
			blacklistModelStub = sinon.stub(blacklistModel, 'getByOuid');
			foo = proxyquire('../../controllers/blacklistController', { blacklistModel: { getByOuid: blacklistModelStub}});
			blacklistModelStub.withArgs(8).yields(null,fakeData);
		});

		after(function () {
			blacklistModel.getByOuid.restore();
		});

		it('getByOuidAction returns success', function (done) {
			foo.getByOuidAction(8, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getByOuidAction', function(){
		before(function () {
			blacklistModelStub = sinon.stub(blacklistModel, 'getByOuid');
			foo = proxyquire('../../controllers/blacklistController', { blacklistModel: { getByOuid: blacklistModelStub}});
			blacklistModelStub.withArgs(8).yields('Invalid ouid',{});
		});

		after(function () {
			blacklistModel.getByOuid.restore();
		});

		it('getByOuidAction returns error', function (done) {
			foo.getByOuidAction(8, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
	// // End test cases for getByOuidAction

	// Start test cases for putDeleteAction
	describe('when model returns success for putDeleteAction', function(){
		before(function () {
			blacklistModelStub = sinon.stub(blacklistModel, 'removeNumbers');
			req =  {body:{blacklist:{org_unit_id:4}}}; 
			foo = proxyquire('../../controllers/blacklistController', { blacklistModel: { removeNumbers: blacklistModelStub}});
			blacklistModelStub.yields(null,{});
		});

		after(function () {
			blacklistModel.removeNumbers.restore();
		});

		it('putDeleteAction returns success', function (done) {
			foo.putDeleteAction(req, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for putDeleteAction', function(){
		before(function () {
			req =  {body:{blacklist:{org_unit_id:4}}};
			blacklistModelStub = sinon.stub(blacklistModel, 'removeNumbers');
			foo = proxyquire('../../controllers/blacklistController', { blacklistModel: { removeNumbers: blacklistModelStub}});
			blacklistModelStub.yields('There are no routes for this ouid',{});
		});

		after(function () {
			blacklistModel.removeNumbers.restore();
		});

		it('putDeleteAction returns error', function (done) {
			foo.putDeleteAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});

	// start test cases for postAction
	describe('when model returns success for postAction', function(){
		
		req = {body:{blacklist:{org_unit_id:"8", numbers:"1234567898,1234568545"}}};
		before(function () {
			blacklistModelStub = sinon.stub(blacklistModel, 'create');
			foo = proxyquire('../../controllers/blacklistController', { blacklistModel: { create: blacklistModelStub}});
			// blacklistModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			blacklistModelStub.yields(null, 'Blacklist created');
		});

		after(function () {
			blacklistModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for postAction', function(){
		req = {body:{blacklist:{org_unit_id:"8", numbers:"1234567898,1234568545"}}};
		before(function () {
			blacklistModelStub = sinon.stub(blacklistModel, 'create');
			foo = proxyquire('../../controllers/blacklistController', { blacklistModel: { create: blacklistModelStub}});
			// blacklistModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			blacklistModelStub.yields('Invalid ouid', {});
		});

		after(function () {
			blacklistModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
	// end test cases for postAction

	// start test cases for appendAction
	describe('when model returns success for appendAction', function(){
		
		req = {body:{blacklist:{org_unit_id:"8", numbers:"1234567898,1234568545"}}};
		before(function () {
			blacklistModelStub = sinon.stub(blacklistModel, 'append');
			foo = proxyquire('../../controllers/blacklistController', { blacklistModel: { append: blacklistModelStub}});
			// blacklistModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			blacklistModelStub.yields(null, 'Blacklist created');
		});

		after(function () {
			blacklistModel.append.restore();
		});

		it('appendAction returns success', function (done) {
			foo.appendAction(req, function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for appendAction', function(){
		req = {body:{blacklist:{org_unit_id:"8", numbers:""}}};
		before(function () {
			blacklistModelStub = sinon.stub(blacklistModel, 'append');
			foo = proxyquire('../../controllers/blacklistController', { blacklistModel: { append: blacklistModelStub}});
			// blacklistModelStub.withArgs(req).yields(null,'{"tag_id":"288"}');
			blacklistModelStub.yields('****** No blacklist numbers', {});
		});

		after(function () {
			blacklistModel.append.restore();
		});

		it('appendAction returns success', function (done) {
			foo.appendAction(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});
	});
	// end test cases for appendAction
});