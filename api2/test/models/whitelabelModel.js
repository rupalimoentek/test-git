"use_strict";
var sinon =  require('sinon'),
	whitelabelModel = require('../../models/whitelabelModel'),
	appModel = require('../../models/appModel');
	

describe('whitelabelModel.Get returns data from query', function () {
	before(function(done){
		sinon
			.stub(appModel.ctPool,'query')
			.yields(null,  {
    			"result": "success",
    			"err": null,
    			"json":
    			[
        			{
        			    "org_unit_id": 12,
        			    "domain_name": "http://mydomain3.com",
        			    "support_url": "http://support.mydomain.com",
        			    "chat_url": null,
        			    "org_logo": "https://cfa-whitelabel-dev.s3.amazonaws.com/NAISq8MJ_1447890187926.png?AWSAccessKeyId=AKIAJIAKTPHTBNZHAK5Q&Expires=1448494988&Signature=mRxFj6X69NWySxA%2BA5iywG3K7GU%3D",
        			    "chat_active": false,
        			    "white_label_active": true,
        			    "white_label_css": {
            		    "some values": 34
           				 }
       				}
   				]
			});
			done();
	});
    after(function(done){
  	  appModel.ctPool.query.restore();
      done();
 	});

	it('returns valid whitelabel profile data',function(done){
		whitelabelModel.get(12,function(err,data){

	      if(err) return done(err);
	      appModel.ctPool.query.called.should.be.equal(true);
	      data.should.not.be.empty;
	     // console.log('data:',data);
	      data.should.have.property('result','success');
	      done();
		});

	});
});

describe('whitelabelModel.Get passed in id is not a number', function () {

	it('returns error message',function(done){
		whitelabelModel.get("NAN",function(err,data){

	      err.should.equal("Invalid whitelabel ID submitted");

	      done();
		});

	});
});
describe('whitelabelModel.Get when passed in id is undefined', function () {

	it('returns error message',function(done){
		whitelabelModel.get(undefined,function(err,data){

	      err.should.equal("Invalid whitelabel ID submitted");

	      done();
		});

	});
});
describe('whitelabelModel.Get returns error from query', function () {
	before(function(done){
		sinon
			.stub(appModel.ctPool,'query')
			.yields('Query error in ctPool.',  null);
			done();
	});
    after(function(done){
  	  appModel.ctPool.query.restore();
      done();
 	});

	it('returns error message',function(done){
		whitelabelModel.get(12,function(err,data){

	     
	      appModel.ctPool.query.called.should.be.equal(true);
	      err.should.not.be.empty;
	     // console.log('data:',data);
	      err.should.equal('Query error in ctPool.');
	      done();
		});

	});
});