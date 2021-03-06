var commonMethods = {};

	commonMethods.mysql               	= require('mysql'),
	commonMethods.connector           	= require('../models/appModel'),
	commonMethods.appModel            	= require('../models/appModel'),
	commonMethods.ctTransactionModel  	= require('../models/ctTransactionModel'),
	commonMethods.yaml                	= require("js-yaml"),
	commonMethods.f                  	= require('../functions/functions.js'),
	commonMethods.access              	= require('../controllers/userAccessController'),
	commonMethods.fs                  	= require('fs'),
	commonMethods.e                   	= yaml.load(commonMethods.fs.readFileSync("config/database.yml")),
	commonMethods.async               	= require('async'),
	commonMethods.envVar              	= process.env.NODE_ENV,
	commonMethods.orgUnitModel        	= require('../models/orgUnitModel.js'),
	commonMethods.callFlowModel       	= require('../models/callFlowModel.js'),
	commonMethods.numberPoolModel     	= require('../models/newNumberPoolModel.js'),
	commonMethods.report              	= require('../models/reportModel.js'),
	commonMethods.table               	= 'callFlowReport',
	commonMethods.moment			  	= require('moment'),
	commonMethods.momentTimezone      	= require('moment-timezone');
	commonMethods.amqp        	      	= require('amqplib'),
	commonMethods.ctlogger            	= require('./ctlogger.js'),
	commonMethods.when                	= require('when'),
	commonMethods.toll_frees          	= require('../config/toll_free.json'),
	commonMethods.grep                	= require('grep-from-array'),
	commonMethods._						= require('underscore');
	commonMethods.rabbit 				= commonMethods.yaml.load(commonMethods.fs.readFileSync("./config/rabbit.yml"));
	commonMethods.timezone 				= 'UTC';
	commonMethods.url 					= 'amqp://'+commonMethods.rabbit[envVar].user+':'+commonMethods.rabbit[envVar].password+'@'+commonMethods.rabbit[envVar].host+':'+commonMethods.rabbit[envVar].port+'/'+commonMethods.rabbit[envVar].vhost,
	commonMethods.s3yml = commonMethods.yaml.load(commonMethods.fs.readFileSync("config/s3.yml")),
	commonMethods.AWS = require('aws-sdk');
	module.exports = commonMethods;