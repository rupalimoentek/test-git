"use_strict";
var proxyquire =  require('proxyquire'),
	loginModel = require('../../models/loginModel'),
	foo;

describe('Login Controller', function () {
 	var loginModelStub,
  	req = {username: 'walter', password: 'white'};
  	describe('when model returns error', function(){
		before(function () {
			loginModelStub = sinon.stub(loginModel, 'auth');
			foo = proxyquire('../../controllers/loginController', { loginModel: { auth: loginModelStub}});
			loginModelStub.withArgs(req).yields('heisenberg',null);
		});

		after(function () {
			loginModel.auth.restore();
		});

		it('login returns error', function (done) {
			foo.loginAction(req, function(err, data){
				assert.equal(err, 'heisenberg');
				done();
			});
		});
	});
	describe('when model returns data', function(){
		before(function () {
			loginModelStub = sinon.stub(loginModel, 'auth');
			foo = proxyquire('../../controllers/loginController', { loginModel: { auth: loginModelStub}});
			loginModelStub.withArgs(req).yields(null,'some data');
		});

		after(function () {
			loginModel.auth.restore();
		});

		it('login returns error', function (done) {
			foo.loginAction(req, function(err, data){
				assert.equal(data, 'some data');
				done();
			});
		});
	});
});