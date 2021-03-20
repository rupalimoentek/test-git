/*/*
 Dev: Yogesh Thombare
 Controller : channelController controller 
*/

"use_strict";
var proxyquire =  require('proxyquire'),
	channelModel = require('../../models/channelModel'),
	controller = require('../../controllers/appController'),
	f = require('../../functions/functions'),
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
 	var channelModelStub, req;
	// Start test cases for read
	describe('when model returns success for getAction', function(){
		before(function () {
			req = {}
			channelModelStub = sinon.stub(channelModel, 'read');
			foo = proxyquire('../../controllers/channelController', { channelModel: { getAction: channelModelStub}});
			channelModelStub.yields(fakeData);
		});

		after(function () {
			channelModel.read.restore();
		});

		it('getAction returns success', function (done) {
			foo.getAction(req, function(data){
				assert.equal(data,fakeData);
				done();
			});
		});
	});

	describe('when model returns error for getAction', function(){
		before(function () {
			req = {}
			channelModelStub = sinon.stub(channelModel, 'read');
			foo = proxyquire('../../controllers/channelController', { channelModel: { getAction: channelModelStub}});
			channelModelStub.yields('error on read model query');
		});

		after(function () {
			channelModel.read.restore();
		});

		it('read returns error', function (done) {
			foo.getAction(req, function(data){
				assert.equal(data, 'error on read model query');
				done();
			});
		});	
	});
});