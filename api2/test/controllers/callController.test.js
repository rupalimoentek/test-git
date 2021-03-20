/*/*
 Dev: Yogesh Thombare
 Controller : call controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	callModel = require('../../models/callModel'),
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
 	var callModelStub, req;
	// Start test cases for getInfo
	describe('when model returns success for getInfo', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'getInfo');
			foo = proxyquire('../../controllers/callController', { callModel: { getInfo: callModelStub}});
			callModelStub.yields(null,fakeData);
		});

		after(function () {
			callModel.getInfo.restore();
		});

		it('getInfo returns success', function (done) {
			foo.getInfo(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getInfo', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'getInfo');
			foo = proxyquire('../../controllers/callController', { callModel: { getInfo: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.getInfo.restore();
		});

		it('getInfo returns error', function (done) {
			foo.getInfo(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for getInfo

	// start test cases for getComment
	describe('when model returns success for getComment', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'getComments');
			foo = proxyquire('../../controllers/callController', { callModel: { getComments: callModelStub}});
			callModelStub.yields(null,fakeData);
		});

		after(function () {
			callModel.getComments.restore();
		});

		it('getComment returns success', function (done) {
			foo.getComment(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getComment', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'getComments');
			foo = proxyquire('../../controllers/callController', { callModel: { getComments: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.getComments.restore();
		});

		it('getComment returns error', function (done) {
			foo.getComment(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for getComment

	// start test cases for postComment
	describe('when model returns success for postComment', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'postComments');
			foo = proxyquire('../../controllers/callController', { callModel: { postComments: callModelStub}});
			callModelStub.yields(null,'Commment added successfully');
		});

		after(function () {
			callModel.postComments.restore();
		});

		it('postComment returns success', function (done) {
			foo.postComment(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for postComment', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'postComments');
			foo = proxyquire('../../controllers/callController', { callModel: { postComments: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.postComments.restore();
		});

		it('postComment returns error', function (done) {
			foo.postComment(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for postComment

	// start test cases for deleteComment
	describe('when model returns success for deleteComment', function(){
		before(function () {
			req = {params : {id:1}};
			callModelStub = sinon.stub(callModel, 'deleteComments');
			foo = proxyquire('../../controllers/callController', { callModel: { deleteComments: callModelStub}});
			callModelStub.yields(null,'Commment added successfully');
		});

		after(function () {
			callModel.deleteComments.restore();
		});

		it('deleteComment returns success', function (done) {
			foo.deleteComment(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for deleteComment', function(){
		before(function () {
			req = {params : {id:1}};
			callModelStub = sinon.stub(callModel, 'deleteComments');
			foo = proxyquire('../../controllers/callController', { callModel: { deleteComments: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.deleteComments.restore();
		});

		it('deleteComment returns error', function (done) {
			foo.deleteComment(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});

	// Check for error message for invaalid id
	describe('when model returns error for deleteComment', function(){
		before(function () {
			req = {params : {id:null}};
			callModelStub = sinon.stub(callModel, 'deleteComments');
			foo = proxyquire('../../controllers/callController', { callModel: { deleteComments: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.deleteComments.restore();
		});

		it('deleteComment returns error', function (done) {
			foo.deleteComment(req, function(err, data){
				console.log(err, data);
				assert.equal(err, 'Nonvalid/Nonexist ID specified!');
				done();
			});
		});	
	});
	// end test cases for deleteComment

	// start test cases for getTag
	describe('when model returns success for getTag', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'getTags');
			foo = proxyquire('../../controllers/callController', { callModel: { getTags: callModelStub}});
			callModelStub.yields(null,'Commment added successfully');
		});

		after(function () {
			callModel.getTags.restore();
		});

		it('getTag returns success', function (done) {
			foo.getTag(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getTag', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'getTags');
			foo = proxyquire('../../controllers/callController', { callModel: { getTags: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.getTags.restore();
		});

		it('getTag returns error', function (done) {
			foo.getTag(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});

	// Check for error message for invalid id
	describe('when model returns error for getTag', function(){
		before(function () {
			req = {id:null};
			callModelStub = sinon.stub(callModel, 'getTags');
			foo = proxyquire('../../controllers/callController', { callModel: { getTags: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.getTags.restore();
		});

		it('getTag returns error', function (done) {
			foo.getTag(req, function(err, data){
				console.log(err, data);
				assert.equal(err, 'Nonvalid/Nonexist ID specified!');
				done();
			});
		});	
	});
	// end test cases for getTag

	// start test cases for postTag
	describe('when model returns success for postTag', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'postTags');
			foo = proxyquire('../../controllers/callController', { callModel: { postTags: callModelStub}});
			callModelStub.yields(null,'Tag added successfully');
		});

		after(function () {
			callModel.postTags.restore();
		});

		it('postTag returns success', function (done) {
			foo.postTag(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for postTag', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'postTags');
			foo = proxyquire('../../controllers/callController', { callModel: { postTags: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.postTags.restore();
		});

		it('postTag returns error', function (done) {
			foo.postTag(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for postTag
	
	// start test cases for postTag
	describe('when model returns success for emailRecording', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'emailRecordings');
			foo = proxyquire('../../controllers/callController', { callModel: { emailRecordings: callModelStub}});
			callModelStub.yields(null,'Tag added successfully');
		});

		after(function () {
			callModel.emailRecordings.restore();
		});

		it('emailRecording returns success', function (done) {
			foo.emailRecording(req,function(err, data){
				assert.equal(err.status, 'success');
				done();
			});
		});
	});

	describe('when model returns error for emailRecording', function(){
		before(function () {
			req = {id:1};
			callModelStub = sinon.stub(callModel, 'emailRecordings');
			foo = proxyquire('../../controllers/callController', { callModel: { emailRecordings: callModelStub}});
			callModelStub.yields('error in query',{});
		});

		after(function () {
			callModel.emailRecordings.restore();
		});

		it('emailRecording returns error', function (done) {
			foo.emailRecording(req, function(err, data){
				assert.equal(err.status, 'error');
				done();
			});
		});	
	});
	// end test cases for emailRecording
});