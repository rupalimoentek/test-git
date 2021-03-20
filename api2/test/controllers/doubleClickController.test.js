/*/*
 Dev: Yogesh Thombare
 Controller : Double click controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	doubleclickModel = require('../../models/doubleclickModel'),
	f = require('../../functions/functions'),
	controller = require('../../controllers/appController'),
	sinon = require("sinon"),
	assert =  require('assert'),
	ctlogger = require('../../lib/ctlogger.js'),
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

describe('Double Click Controller', function () {
 	var doubleclickModelStub, req;
 	ctloggerStub = sinon.stub(ctlogger, 'log');
	// Start test cases for getAction
	describe('when model returns success for getAction', function(){
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'profile');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { profile: doubleclickModelStub}});
			doubleclickModelStub.withArgs(1).yields({
				result: 'success',
				err: null,
				json: fakeData
			});
		});

		after(function () {
			doubleclickModel.profile.restore();
		});

		it('getAction returns success', function (done) {
			foo.getAction(1,function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getAction', function(){
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'profile');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { profile: doubleclickModelStub}});
			doubleclickModelStub.withArgs(1).yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.profile.restore();
		});

		it('getAction returns error', function (done) {
			foo.getAction(1, function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end of getAction tast cases

	// start test cases for postAction
	describe('when model returns success for postAction', function(){
		req = {body : {dcid:1} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'create');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { create: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'success',
				err: null,
				json: 'Created successfully.'
			});
		});

		after(function () {
			doubleclickModel.create.restore();
		});

		it('postAction returns success', function (done) {
			foo.postAction(req,function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for postAction', function(){
		req = {body : {dcid:1} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'create');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { create: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.create.restore();
		});

		it('postAction returns error', function (done) {
			foo.postAction(req, function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end test cases for postAction

	// start test cases for putAction
	describe('when model returns success for putAction', function(){
		req = {body : {dcid:1} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'update');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { update: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'success',
				err: null,
				json: 'Updated successfully.'
			});
		});

		after(function () {
			doubleclickModel.update.restore();
		});

		it('putAction returns success', function (done) {
			foo.putAction(req,function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for putAction', function(){
		req = {body : {dcid:1} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'update');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { update: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.update.restore();
		});

		it('putAction returns error', function (done) {
			foo.putAction(req, function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end test cases for putAction
	
	// start test cases for mapPostAction
	describe('when model returns success for mapPostAction', function(){
		req = {body : {map:1} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'createMap');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { createMap: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'success',
				err: null,
				json: 'Created successfully.'
			});
		});

		after(function () {
			doubleclickModel.createMap.restore();
		});

		it('mapPostAction returns success', function (done) {
			foo.mapPostAction(req,function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for mapPostAction', function(){
		req = {body : {map:1} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'createMap');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { createMap: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.createMap.restore();
		});

		it('mapPostAction returns error', function (done) {
			foo.mapPostAction(req, function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end test cases for mapPostAction

	// start test cases for mapPutAction
	describe('when model returns success for mapPutAction', function(){
		req = {body : {map:1} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'updateMap');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { updateMap: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'success',
				err: null,
				json: 'Updated successfully.'
			});
		});

		after(function () {
			doubleclickModel.updateMap.restore();
		});

		it('mapPutAction returns success', function (done) {
			foo.mapPutAction(req,function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for mapPutAction', function(){
		req = {body : {map:1} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'updateMap');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { updateMap: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.updateMap.restore();
		});

		it('mapPutAction returns error', function (done) {
			foo.mapPutAction(req, function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end test cases for mapPutAction

	// start test cases for mapDeleteAction
	describe('when model returns success for mapDeleteAction', function(){
		req = {body : {map: {doubleclick_id:1,dc_map_id:1}} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'dropMap');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { dropMap: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'success',
				err: null,
				json: 'Deleted successfully.'
			});
		});

		after(function () {
			doubleclickModel.dropMap.restore();
		});

		it('mapDeleteAction returns success', function (done) {
			foo.mapDeleteAction(req,function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for mapDeleteAction', function(){
		req = {body : {map: {doubleclick_id:1,dc_map_id:1}} ,ouid:1,userid:12};
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'dropMap');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { dropMap: doubleclickModelStub},ctlogger:{log:ctloggerStub}});
			doubleclickModelStub.yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.dropMap.restore();
		});

		it('mapDeleteAction returns error', function (done) {
			foo.mapDeleteAction(req, function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end test cases for mapDeleteAction

	// start test cases for getMetricAction
	describe('when model returns success for getMetricAction', function(){
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'metricList');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { metricList: doubleclickModelStub}});
			doubleclickModelStub.yields({
				result: 'success',
				err: null,
				json: fakeData
			});
		});

		after(function () {
			doubleclickModel.metricList.restore();
		});

		it('getMetricAction returns success', function (done) {
			foo.getMetricAction(function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getMetricAction', function(){
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'metricList');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { metricList: doubleclickModelStub}});
			doubleclickModelStub.yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.metricList.restore();
		});

		it('getMetricAction returns error', function (done) {
			foo.getMetricAction(function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end test cases for getMetricAction

	// start test cases for getListAction
	describe('when model returns success for getListAction', function(){
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'varList');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { varList: doubleclickModelStub}});
			doubleclickModelStub.yields({
				result: 'success',
				err: null,
				json: fakeData
			});
		});

		after(function () {
			doubleclickModel.varList.restore();
		});

		it('getListAction returns success', function (done) {
			foo.getListAction(function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for getListAction', function(){
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'varList');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { varList: doubleclickModelStub}});
			doubleclickModelStub.yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.varList.restore();
		});

		it('getListAction returns error', function (done) {
			foo.getListAction(function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end test cases for getListAction

	// start test cases for callRouteAction
	describe('when model returns success for callRouteAction', function(){
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'callAction');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { callAction: doubleclickModelStub}});
			doubleclickModelStub.withArgs(1).yields({
				result: 'success',
				err: null,
				json: fakeData
			});
		});

		after(function () {
			doubleclickModel.callAction.restore();
		});

		it('callRouteAction returns success', function (done) {
			foo.callRouteAction(1,function(response){
				assert.equal(response.result, 'success');
				done();
			});
		});
	});

	describe('when model returns error for callRouteAction', function(){
		before(function () {
			doubleclickModelStub = sinon.stub(doubleclickModel, 'callAction');
			foo = proxyquire('../../controllers/doubleclickController', { doubleclickModel: { callAction: doubleclickModelStub}});
			doubleclickModelStub.withArgs(1).yields({
				result: 'error',
				err: 'Query error in Ctpool',
				json: {}
			});
		});

		after(function () {
			doubleclickModel.callAction.restore();
		});

		it('callRouteAction returns error', function (done) {
			foo.callRouteAction(1,function(response){
				assert.equal(response.result, 'error');
				done();
			});
		});	
	});
	// end test cases for callRouteAction
});