var express = require('express'),
    report = require('../controllers/reportController'),
    router = express.Router(),
    t = require('../lib/tokenizer');

/* Add headers
router.use(function (req, res, next) {

    // Website you wish to allow to connect
    //res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type,Accept, Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
*/

/* ----- scheduled report end points ------------------ */
router.post('/', function(req, res) {
    report.postReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.post('/schedule', function(req, res) {
    report.postReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.post('/filter', function(req, res) {
    report.postFilterAction(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.post('/filter/rule', function(req, res) {
    report.postFilterRuleAction(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

/*router.get('/filterRules/:id', function(req, res) {
    report.getFilterRules(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});
*/

router.get('/filter/:filter_id', function(req, res) {
    report.getFilter(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/schedule/:schedule_id', function(req, res) {
    report.getSchedule(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});



router.get('/schedule/list', function(req, res) {
    report.getScheduleList(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/schedule/list/:org_unit_id', function(req, res) {
    report.getScheduleList(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/sendNow/:id', function(req, res) {
    report.sendScheduleReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.post('/history', function(req, res) {
    report.postHistory(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/schedreport/:schedule_id', function(req, res) {
    report.getScheduleReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/report/:report_id', function(req, res) {
    report.getReportReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

/*router.get('/reportschedules/:report_id', function(req, res) {
    report.getReportSchedules(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/schedreportbyid/:id', function(req, res) {
    report.getReportById(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});
*/

router.delete('/schedule/:schedule_id', function(req, res) {
    report.deleteSchedule(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.delete('/:report_id', function(req, res) {
    report.deleteReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.post('/cookie', function(req, res) {
    report.postCookie(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.post('/authorize', function(req, res) {
    report.authorizeReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

/* ----- end scheduled report end points ------------------ */

router.get('/callDetail', function(req,res){
    report.getCallDetails(req, function(data){
        res.send(data);
    });
});

/*router.get('/callSummary', function(req,res){
    report.getCallSummary(req, function(data){
        res.send(data);
    });
});
*/

router.get('/buildCallFlow', function(req,res){
    report.buildCallFlowReport(req, function(data){
        res.send({
            result: 'success',
            err: '',
            json: data
        });
    });
});

router.get('/campaignSettings/:filter', function(req,res){
    report.getCampaignSettings(req, function(data){
        res.send(data);
    });
});

router.get('/callFlowSettings', function(req, res) {
    report.getCallFlowSettings(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/ivrSettings/:routableid', function(req, res) {
    report.getIvrSettings(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/percentSettings/:prid', function(req, res) {
    report.getPercentSettings(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/groupActivities', function(req, res) {
    report.getGroupActivities(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/oulist', function(req, res) {
    report.getOuList(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/campaignlist', function(req, res) {
    report.getCampaignList(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/channellist', function(req, res) {
    report.getChannelList(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

router.get('/', function(req,res){
    report.getReport(req, function(err, data) {
        res.send({
            result: (err ? 'error' : 'success'),
            err: err,
            json: data
        });
    });
});

module.exports = router;