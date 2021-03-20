"use_strict";
var proxyquire =  require('proxyquire'),
	provisionedRouteModel = require('../../models/provisionedRouteModel'),
	controller = require('../../controllers/appController'),
	foo;

describe('Provisioned Route Controller', function () {
 	var provisionedRouteModelStub,
 		responsifyStub = {},
  		req = {};
	before(function () {
		var stubs =  {
			provisionedRouteModel:
			{
				createCallFlows: provisionedRouteModelStub,
				responsify: responsifyStub
			}
		};
		foo = proxyquire('../../controllers/provisionedRouteController', stubs);
	});
  	describe('postAction without campaign id', function(){
		req = {
			body: {}
		};
		it('should return error', function (done) {
			foo.postAction(req, function(err, data){
				assert.equal(err.status, 'error');
				assert.equal(err.err, 'Missing campaign id.');
				done();
			});
		});
	});
});