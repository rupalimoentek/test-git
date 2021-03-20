var chai = require('chai'),
    sinonChai = require("sinon-chai");

global.expect = chai.expect;
global.sinon = require('sinon');
global.assert =  require('assert');
global.should = require('should');
chai.use(sinonChai);