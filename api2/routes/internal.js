var express                     = require('express'),
    router	                    = express.Router(),
    orgUnit				        = require('../controllers/orgUnitController'),
    campaign                    = require('../controllers/campaignController'),
    role                        = require('../controllers/roleController'),
    user                        = require('../controllers/ctUserController'),
    phoneVendor                 = require('../controllers/phoneVendorController'),
    phoneNumber                 = require('../controllers/phoneNumberController'),
    callFlowRecording           = require('../controllers/callFlowRecordingController'),
    numberPool                  = require('../controllers/numberPoolController'),
    newNumberPool               = require('../controllers/newNumberPoolController'),
    channel                     = require('../controllers/channelController'),
    provisionedRoute            = require('../controllers/provisionedRouteController'),
    callFlow                    = require('../controllers/callFlowController'),
    dniSetting                  = require('../controllers/dniSettingController'),
    migAccountFeatures          = require('../controllers/migAccountFeaturesController'),
    migCustomerFeatures         = require('../controllers/migCustomerFeaturesController'),
    migCampaignProvisioning     = require('../controllers/migCampaignProvisioningController'),
    migGroup                    = require('../controllers/migGroupController'),
    migRoute                    = require('../controllers/migRouteController'),
    migCampaign                 = require('../controllers/migCampaignController'),
    phoneNumber                 = require('../controllers/phoneNumberController'),
    industry                    = require('../controllers/industryController'),
    billing                     = require('../controllers/billingController'),
    tag                         = require('../controllers/tagController'),
    dniOrgUnit                  = require('../controllers/dniOrgUnitController'),
    zuora                       = require('../controllers/zuoraController'),
    callAction                  = require('../controllers/callActionController'),
    webhook                     = require('../controllers/webhookController'),
    report                      = require('../controllers/reportController'),
    call                        = require('../controllers/callController'),
    scoremanualaction           = require('../controllers/scoreManualActionController'),
    userPermissions             = require('../controllers/userPermissionController'),
    geoLookups                  = require('../controllers/geoLookupController'),
    shoutPoint                  = require('../controllers/shoutPointController'),
    customSource                = require('../controllers/customSourceController')
    ct_user                     = require('../controllers/ctUserController');

// Add headers
router.use(function (req, res, next) {

    // Website you wish to allow to connect
    //res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

router.put('/scorecardPermission', function(req, res) {
    userPermissions.saveUserScorecardPermissions(req, function(data) {
        res.send(data);
    });
});

router.post('/scoremanualaction/:id', function(req, res) {
    scoremanualaction.createBulkScoreAction(req, function(data) {
        res.send(data);
    });
});

router.put('/user/defaultpassword',function(req,res){
    user.setDefaultPasswordAction(req,function(data){
        res.send(data);
    });
});

router.put('/orgAllowAdmin',function(req,res){
    orgUnit.setOrgAllowAdminByOuidAction(req,function(data){
        res.send(data);
    });
});

router.get('/orgAllowAdmin/ouid/:ouid',function(req,res){
    orgUnit.getOrgAllowAdminByOuidAction(req,function(data){
        res.send(data);
    });
});

router.get('/webhook/target/:webhookid',function(req,res){
    webhook.getTargetByIdAction(req,function(data){
        res.send(data);
    });
});

router.get('/getRateCenterState/:number',function(req,res){
   phoneNumber.getRateCenterStateAction(req,function(data){
        res.send(data);
    });
});

router.get('/schedReport/:ouid',function(req,res){
    report.getReportByOuidAction(req,function(data){
        res.send(data);
    });
});

router.get('/webhook/ouid/:ouid',function(req,res){
    webhook.getWebhooksByOuid(req.params.ouid,function(data){
        res.send(data);
    });
});

router.get('/mig/group/customerid/:customer_id',function(req,res){
    migGroup.getByCustomerIdAction(req,function(data){
        res.send(data);
    });
});

router.get('/report/sendNow/:id', function(req, res) {
    report.sendScheduleReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/ouHasScorecard/:ouid',function(req,res){
    orgUnit.hasManualScorecard(req.params.ouid,function(data){
        res.send(data);
    });
});

router.post('/mig/data',function(req,res){
    switch(req.body.data.table){
        case 'mig_customer_features':
            migCustomerFeatures.postDataAction(req,function(response){
                res.send(response);
            });
        break;
        case 'mig_account_features':
            migAccountFeatures.postDataAction(req,function(response){
                res.send(response);
            });
        break;
        case 'mig_campaign_provisioning':
            migCampaignProvisioning.postDataAction(req,function(response){
                res.send(response);
            });
        break;
        default:
            console.log('missing table '+req.body.data.table);
            res.send({status: 'error',err: 'missing table '+req.body.data.table, json: {}});
    }
    
});

router.get('/callActionByRouteId/:routeid', function(req, res) {
    callAction.byRouteAction(req, req.params.routeid, function(err, data) {
        console.log(data);
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.put('/callAction/target',function(req,res){
    callAction.changeTargetAction(req,function(data){
        res.send(data);
    });
});

router.get('/orgUnit/level/:id', function(req, res){
    // get quantity of users, campaigns, call flows
    orgUnit.ouLevel(req, function(err, data){
        res.send({
            result: (err ? "error": "success"),
            err:    err,
            json:   data
        });
    });
});

router.get('/orgUnit/in', function(req, res){
    orgUnit.inAction(req, function(response){
        res.send(response)
    });
});

router.get('/phonenumber/number/:number',function(req,res){
    phoneNumber.getPhoneByNumberAction(req,function(response){
        res.send(response);
    });
});

router.get('/phoneNumberData/:number',function(req,res){
    phoneNumber.getPhoneDataByNumberAction(req,function(response){
        res.send(response);
    });
});

router.post('/mig/Group',function(req,res){
    migGroup.postAction(req,function(response){
        res.send(response);
    });
});

router.post('/mig/Route',function(req,res){
    migRoute.postAction(req,function(response){
        res.send(response);
    });
});

router.post('/mig/Campaign',function(req,res){
    migCampaign.postAction(req,function(response){
        res.send(response);
    });
});

router.get('/mig/customers/:session_id/:account_id',function(req,res){
    migCustomerFeatures.getCustomersAction(req,function(results){
        res.send(results);
    });
});

router.get('/mig/campaigns/:session_id/:account_id',function(req,res){
    migCampaignProvisioning.getCampaignsAction(req,function(results){
        res.send(results);
    });
});

router.get('/mig/account/sessions',function(req,res){
    migAccountFeatures.getSessionsAction(req,function(results){
        res.send(results);
    });
});

router.get('/mig/account/:id',function(req,res){
    migAccountFeatures.getByIdAction(req,function(data){
        res.send(data);
    });
});

router.get('/phonevendor/name/:name',function(req,res){
    phoneVendor.getIdByNameAction(req,function(data){
        res.send(data);
    });
});

router.get('/orgunit/single/:id', function(req,res){
   orgUnit.getByIdActionInternal(req, function(data){
        res.send(data);
    });
});

router.put('/orgunit/setShoutPointMigrated', function(req,res){
    orgUnit.setShoutPointMigrated(req, function(data){
         res.send(data);
     });
 });
 
router.get('/orgunit/extid/:id/billingid/:billingid', function(req, res){
    orgUnit.extIdExist(req, function(data){
        res.send(data);
    });
});

router.get('/campaign/ouid/:id', function(req,res){
    campaign.getAllUnderOuidAction(req.params.id, function(data){
        res.send(data);
    });
});

router.get('/channel',function(req,res){
    channel.getAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/role', function(req, res){
    role.getAllAction(function(data){
        res.send(data);
    });
});

router.get('/orgunit/all/:id', function(req,res){
    orgUnit.getAllAction(req.params.id, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/orgunit/byTopOu/:id', function(req,res){
    orgUnit.getAllByTopAction(req.params.id, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/orgunit/usersAndUp/:ouid',function(req,res){
    orgUnit.getOuAndAboveActiveUsersAction(req.params.ouid,function(data){
        res.send(data);
    });
});

router.get('/campaign-user/ouid/:ouid', function(req,res){
    user.allowedCampaignUsers(req.params.ouid,function(data){
        res.send(data);
    });
});

router.get('/campaign/allowedOwners/ouid/:ouid', function(req,res){
    campaign.allowedOwnersAction(req,function(data){
        res.send(data);
    });
});

router.get('/user/ouid/:ouid', function(req,res){
    orgUnit.getSelfAndTopLevelUsersByOuid(req.params.ouid,function(data){
        res.send(data);
    });
});

router.get('/user/nameIn',function(req,res){
    var namesArr = req.query.names.split(',');

    user.getUsersByNamesAction(namesArr,function(data){
        res.send(data);
    });
});

router.get('/user/groupandup/:ouid',function(req,res){
	user.getUsersByGroupAndUp(req.params.ouid,function(data){
        res.send(data);
    });
});

router.get('/numberpool/provisioned_route/:prid', function(req,res){
	numberPool.getLMCPoolsByProvisionedRouteIdAction(req.params.prid,function(data){
        res.send(data);
	});
});

router.get('/industry', function(req,res){
    industry.getAction(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.put('/numberpool',function(req,res){
    numberPool.updateAction(req,function(data){
        console.log('number pool update response data is '+JSON.stringify(data))
        res.send(data);
    });
});

router.post('/campaign/create', function(req,res){
    campaign.postAction(req, function(data){
        res.send(data);
    });
});

router.post('/campaign/move', function(req,res){
    campaign.moveAction(req, function(data){
        res.send(data);
    });
});

router.post('/orgunit', function(req,res){
    req.userid = 2;
    req.user = {user_id: 2,ou_id: 8};
    orgUnit.postAction(req, function(data){
        res.send(data);
    });
});

router.post('/campaign', function(req,res){
    campaign.postAction(req, function(data){
        res.send(data);
    });
});

router.post('/user', function(req,res){
    var user = require('../controllers/ctUserController');
    user.postAction(req, function(err, data){
        res.send({
        result: (err ? 'error' : 'success'),
        err: err,
        json: data
        });
    });
});

router.post('/user/noemail', function(req,res){
    var user = require('../controllers/ctUserController');
    console.log("user "+JSON.stringify(req.body.user))
    
    req.userid = 2;
    req.user = {
        orglist: [req.body.user.ct_user_ou_id],
        ou_id: req.body.user.ct_user_ou_id,
        user_id: 2,
        source: 'amp'
    };
    user.postAction_noemail(req, function(err, data){
        res.send({
        result: (err ? 'error' : 'success'),
        err: err,
        json: data
        });
    });
});

router.post('/phonenumber', function(req,res){
    phoneNumber.postAction(req, function(data){
        res.send(data);
    });
});

router.put('/phonenumber/unprovision',function(req,res){
    phoneNumber.unprovisionByIdAction(req,function(response){
        res.send(response);
    });
});

router.put('/phonenumber/updatestatus',function(req,res){
    phoneNumber.updateStatusAction(req,function(response){
        res.send(response);
    });
});

router.put('/campaign/status', function(req,res){
    campaign.statusAction(req, function(data){
        res.send(data);
    });
});
router.post('/recording/upload', function(req,res){
    callFlowRecording.uploadAction(req, function(data){
        res.send(data);
    });
});

router.post('/provisionedroute/create', function(req,res){
    req.is_migrated = true;
    provisionedRoute.postAction(req, function(data){
        res.send(data);
    });
});

router.get('/number/:number', function(req,res){
    phoneNumber.numberAction(req.params.number, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/numberVendor/:number', function(req,res){
    phoneNumber.numberVendorAction(req.params.number, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.put('/phonenumber/updateLmcReferance', function(req,res){
    phoneNumber.updateLmcReferanceAction(req, function(data){
       res.send(data);
    });
});

router.post('/dnisetting', function(req,res){
      //console.log(req);
    dniSetting.postAction(req, function(data){
        res.send(data);
    });
});

router.delete('/callflow/id/:id', function(req,res){
    callFlow.deleteByIdAction(req.params.id, function(data){
        res.send(data);
    })
});

router.get('/callflowByCampaignId/id/:id', function(req,res){
    campaign.getCallflowByCampaignIdAction(req.params.id, function(data){
        res.send(data);
    })
});

router.get('/searchCallflowByCampaignId', function(req,res){
    campaign.searchCallflowByCampaignIdAction(req, function(data){
        res.send(data);
    })
});

router.delete('/orgunit/id/:ouid',function(req,res){
    orgUnit.deleteAccountAction(req, function(data){
        res.send(data);
    });
});

router.get('/orgunit/getBillingNodeByOuid/:id', function(req,res){
   migCampaign.getBillingNodeAction(req.params.id, function(data){
        res.send(data);
    });
});

router.get('/campaignbyCampaignId/campaignId/:id', function(req,res){
    migCampaign.getCampaignByCamapignIdAction(req.params.id, function(data){
        res.send(data);
    });
});

router.get('/campaignbyouid/ouid', function(req,res){
    migCampaign.getCampaignByOuidAction(req, function(data){
        res.send(data);
    });
});

router.get('/campaignsByOuid', function(req,res){
    migCampaign.getCampaignsByOuidAction(req, function(data){
        res.send(data);
    });
});

router.post('/moveCampaignToOu', function(req,res){
    migCampaign.postMigrateCampaignAction(req, function(data){
        res.send(data);
    });
});

router.post('/moveProvisionedRouteToCampaign', function(req,res){
    provisionedRoute.moveProvisionedRouteToCampaignAction(req, function(data){
        res.send(data);
    });
});

router.get('/usersbyouid/:ouid', function(req,res){
    migRoute.getUsersByOuidAction(req.params.ouid, function(data){
        res.send(data);
    });
});

router.get('/locations/:ouid',function(req,res){
    console.log("req.params.ouid",req.params.ouid);
    migRoute.getLocations(req.params.ouid, function(data){
        res.send(data);
    });
});

router.get('/numberPool/getByBillingOuid/:ouid', function(req,res){
    console.log("req.params.ouid",req.params.ouid);
    newNumberPool.getByBillingOuid(req, function(data){
        res.send(data);
    });
});

router.get('/numberPool/getByOuid/:ouid', function(req,res){
    console.log("req.params.ouid",req.params.ouid);
    numberPool.getLMCPoolsByOuid(req.params.ouid, function(data){
        console.log("data:",JSON.stringify(data));
        res.send(data);
    });
});
router.post('/create_number_pool', function(req,res){
    numberPool.internaleCreateNumberPool(req, function(data){
        console.log("data:",JSON.stringify(data));
        res.send(data);
    });
});
router.post('/migrateBillingAccount', function(req,res){
    req.userid = 2;
    req.user = {user_id: 2};
    billing.postMigrateBillingAccount(req, function(err, data){
        res.send({
        status: (err ? 'error' : 'success'),
        err: err,
        json: data
        });
    });
});
router.post('/validate_csv_data', function(req, res){
    callFlow.validate_csv_data(req.body, function(data){
        res.send(data);
    });
});

router.post('/createCallFlowByCsv', function(req, res){
    callFlow.createCallFlowByCsv(req.body, function(data){
        res.send(data);
    });
});

router.put('/updateNumberPool', function(req,res){
    numberPool.updateAction(req, function(data){
        res.send(data);
    });
});
router.post('/migrateCallTag/', function(req,res){
    call.postTag(req, function(data){
        res.send(data);
    });
});
router.post('/migrateTag', function(req,res){
    tag.postAction(req, function(data){
        res.send(data);
    });
});
router.put('/activateCampaignAndCallflow', function(req,res){
    campaign.statusAction(req, function(data){
        res.send(data);
    });
});
router.put('/updateCampaignEndDate', function(req,res){
    campaign.updateCampaignEndDateAction(req, function(data){
        res.send(data);
    });
});
router.put('/linkCallFlowRecording', function(req,res){
    callFlowRecording.linkCallFlowRecording(req, function(data){
        res.send(data);
    });
});

router.get('/cfaCampaignSingle/:campaignId', function(req, res){
    campaign.cfaCampaignSingle(req.params.campaignId, function(data){
        console.log("res internal", data);
        res.send(data);
    });
});

router.post('/save_dni_code', function(req,res){
    dniOrgUnit.postActionForCqm(req, function(data){
        res.send(data);
    });
});

router.post('/get_provisioned_route_ids_by_ids', function(req,res){
    provisionedRoute.getActionProvisionedRouteIdsByIds(req, function(data){
        res.send(data);
    });
});

router.post('/get_group_ids_by_ids', function(req,res){
    orgUnit.getActionOuIdsByIds(req, function(data){
        res.send(data);
    });
});

router.get('/getBillingAccount/:ouid', function(req,res){
    billing.getBillingData(req.params.ouid, function(err, data){
        res.send({
        status: (err ? 'error' : 'success'),
        err: err,
        json: data
        });
    });
});

router.get('/get_self_and_top_level_users_by_ouid/:ouid', function(req,res){
    orgUnit.getSelfAndTopLevelUsersByOuid(req.params.ouid, function(data){
        res.send(data);
    });
});

router.get('/checkCfaParentLevel/:parentOU', function(req,res){
    orgUnit.checkCfaParentLevel(req.params.parentOU, function(data){
        res.send(data);
    });
});

router.post('/getmigratedUsersRole', function(req,res){
    var user = require('../controllers/ctUserController');
    user.getmigratedUsersRole(req.body.data, function(data){
        res.send(data);
    });
});

router.post('/setOrgAccountComponent',function(req,res){
    orgUnit.setOrgAccountComponentAction(req,function(response){
        res.send(response);
    });
});

router.post('/setUserReportPermissions',function(req,res){
    userPermissions.setUserReportPermissionsAction(req,function(response){
        res.send(response);
    });
});

router.post('/numberpool', function(req,res){
    newNumberPool.postAction(req, function(data){
        res.send(data);
    });
});

router.put('/provisionedroute/delete', function(req,res){
    req.userid = 2;
    req.user = {user_id: 2};
    req.ouid = 8
    
    provisionedRoute.putDeleteAction(req, function(data){
        res.send(data);
    });
});

router.post('/phoneDetailByProvisionedRouteIds', function(req,res){
    provisionedRoute.phoneDetailByProvisionedRouteIds(req, function(data){
        res.send(data);
    });
});

router.post('/poolDetailByProvisionedRouteIds', function(req,res){
    provisionedRoute.poolDetailByProvisionedRouteIds(req, function(data){
        res.send(data);
    });
});

router.get('/phoneNumbersByBillingOuid', function(req,res){
    phoneNumber.phoneNumbersByBillingOuid(req, function(data){
        res.send(data);
     });
});

router.post('/setMigrationAccount', function(req, res){
    orgUnit.setMigrationAccount(req, function(data){
        res.send(data);
    });
});

router.get('/geolookup/cities/:str', function(req,res){
    geoLookups.getCitiesAction(req, req.params.str, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/phonenumber/city/:city/state/:state/npa/:npa', function(req, res) {
    phoneNumber.cityStateNpaAction(req.params.city, req.params.state, req.params.npa, req.is_migrated, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/shoutpoint/rcState/:rc/:state', function(req,res){
	console.log('calling rcState');
	shoutPoint.rcStateAction(req.params.rc, req.params.state, function(err, data){
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

router.get('/poolDataByRouteId', function(req,res){
    provisionedRoute.poolDataByRouteId(req, function(data){
        res.send(data);
     });
});

router.get('/getAccessibleOuid', function(req,res){
    userPermissions.getAccessibleOuid(req, function(data){
        res.send(data);
     });
});

router.get('/getUserPermissions', function(req,res){
    userPermissions.getUserPermissions(req, function(data){
        res.send(data);
     });
});

router.get('/routeDataForUpdate', function(req,res){
    provisionedRoute.routeDataForUpdate(req, function(data){
        res.send(data);
     });
});

router.get('/orgunit/forMove/:id', function(req,res){
    orgUnit.forMove(req, function(data){
         res.send(data);
     });
 });

 router.post('/orgunit/move', function(req, res){
    orgUnit.move(req, function(data){
        res.send(data);
    });
});

router.get('/orgunit/usersForCampaign/:ouid', function(req,res){
    orgUnit.usersForCampaign(req,function(data){
        res.send(data);
    })
});
router.get('/getUserInformation', function(req, res) {
    user.getUserInformation(req, function(data) {
        res.send(data);
    });
});
router.get('/getUserDataByEmailId', function(req, res) {
    user.getUserDataByEmailId(req, function(data) {
        res.send(data);
    });
});
router.get('/getUserDataBybilllingId', function(req, res) {
    user.getUserDataBybilllingId(req, function(data) {
        res.send(data);
    });
});
router.get('/accountCallFlowRecordings/:ouid/:type', function(req,res){
    callFlowRecording.accountCallFlowRecordings(req,function(data){
        res.send(data);
    })
});

router.get('/byNumberData', function(req,res){
    provisionedRoute.byNumberData(req, function(data){
        console.log("In INternal routes");
        res.send(data);
     });
});
router.get('/getBillingOUNames', function(req, res) {
    orgUnit.getBillingOUNames(req, function(data) {
        res.send(data);
    });
});
router.get('/getAccountInfo', function(req, res) {
    orgUnit.getAccountInfo(req, function(data) {
        res.send(data);
    });
});
router.get('/validateBillingId', function(req, res) {
    orgUnit.validateBillingId(req, function(data) {
        res.send(data);
    });
});
/* CSV provisionedRoute update  */
router.put('/update/csv/provisionedRoute', function(req,res){
    console.log("In INternal routes");
    let is_migrated = false;
    if(req.headers.is_migrated == 'True'){
        is_migrated = true
    };
    req.is_migrated = is_migrated;
    req.userid = parseInt(req.headers.user_id)
    req.ouid = parseInt(req.headers.ou_id)
    provisionedRoute.putAction(req, function(data){
        console.log("In INternal routes");
        res.send(data);
    });
});

router.get('/getCallFlowRecordings/:ouid/:type', function(req,res){
    callFlowRecording.getCallFlowRecordingByOuId(req,function(data){
        res.send(data);
    })
});
/*Added for CT-42209 webhook creation*/
router.post('/webhook/create', function(req, res){
    webhook.postAction(req, function(data){
        res.send(data);
    });
});

router.get('/getBillingOuInfo/:ouid', function(req,res){
    billing.getAction(req.params.ouid, function(err, data){
        res.send({
        status: (err ? 'error' : 'success'),
        err: err,
        json: data
        });
    });
});

router.get('/customSource/:ouid', function(req,res){
    customSource.read(req, function(data){
        res.send(data);
    });
});

router.post('/customSource', function(req, res){
    customSource.postAction(req, function(data){
        res.send(data);
    });
});
router.delete('/customSource', function(req, res){
    orgUnit.deleteCustomSource(req, function(data){
        res.send(data)
    });
});
module.exports = router;
