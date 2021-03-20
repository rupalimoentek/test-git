var express = require('express'),
    cors = require('cors'),
    path = require('path'),
    favicon = require('static-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    yaml = require("js-yaml"),
    fs = require("fs"),
    d = yaml.load(fs.readFileSync('./config/directories.yml')),
    c = yaml.load(fs.readFileSync('./config/config.yml')),
    envVar = process.env.NODE_ENV,
    passport = require('passport'),
    methodOverride = require('method-override'),
    oauth2 = require('./lib/oauth2'),
    randomString = require('randomstring');
require('./lib/auth');

// ----- set all the routes --------------------------------------------
var analytic = require('./routes/analytic'),
    api_status = require('./routes/api_status'),
    bandwidth = require('./routes/bandwidth'),
    shoutpoint = require('./routes/shoutPoint'),
    billing = require('./routes/billing'),
    blacklist = require('./routes/blacklist'),
    call = require('./routes/call'),
    callaction = require('./routes/callaction'),
    calldetail = require('./routes/calldetail'),
    callflow = require('./routes/callflow'),
    callflowrecording = require('./routes/callflowrecording'),
    campaign = require('./routes/campaign'),
    channel = require('./routes/channel'),
    conversation = require('./routes/conversation'),
    dailysums = require('./routes/dailysums'),
    dniorgunit = require('./routes/dniorgunit'),
    dnisetting = require('./routes/dnisetting'),
    doubleclick = require('./routes/doubleclick'),
    email = require("./routes/email"),
    emaildigesttasks = require('./routes/emaildigesttasks'),
    emailtemplate = require("./routes/emailtemplate"),
    geolookup = require('./routes/geolookup'),
    getorganizationalunitsbyname = require('./routes/getorganizationalunitsbyname'),
    groupcallcounts = require('./routes/groupcallcounts'),
    groupcallswithscores = require('./routes/groupcallswithscores'),
    groupuseremails = require('./routes/groupuseremails'),
    indicator = require('./routes/indicator'),
    industry = require('./routes/industry'),
    location = require('./routes/location'),
    locationroute = require('./routes/locationroute'),
    logactivity = require('./routes/logactivity'),
    login = require('./routes/login'),
    mongoemaildigeststoresummary = require('./routes/mongoemaildigeststoresummary'),
    organizationalunits = require('./routes/organizationalunits'),
    organizationalunitsbyusername = require('./routes/organizationalunitsbyusername'),
    orgunit = require('./routes/orgunit'),
    numberpool = require('./routes/numberpool'),
    //  parentemails                    = require('./routes/parentemails'),
    phonenumber = require('./routes/phonenumber'),
    provisionedroute = require('./routes/provisionedroute'),
    ral = require('./routes/ral'), //CM mock endpoint
    report = require('./routes/report'),
    role = require('./routes/role'),
    referralCampaign = require('./routes/referralCampaign'),
    routes = require('./routes/index'),
    security = require('./routes/security'), //CM mock endpoint
    session = require('./routes/session'),
    signup = require("./routes/signup"),
    subscription = require('./routes/subscription'),
    support = require("./routes/support"),
    user = require('./routes/ctuser'),
    useraccess = require('./routes/useraccess'),
    tag = require('./routes/tag'),
    customsource = require('./routes/customsource'),
    tester = require('./routes/tester'),
    webhook = require('./routes/webhook'),
    callerprivacy = require('./routes/callerPrivacy'),
    vitelity = require('./routes/vitelity'),
    whitelabel = require('./routes/whitelabel'),
    zuora = require('./routes/zuora'),
    looker = require('./routes/looker'),
    lookerAPI = require('./routes/lookerAPI'),
    schedule = require('./routes/schedule'),
    internal = require("./routes/internal"),
    userPermissions = require("./routes/userPermissions"),
    distributionlist = require("./routes/distributionlist"),
    campaignCallflow = require("./routes/campaigncallflow"),
    defgroupsetting = require("./routes/defaultgroupsetting"),
    scoreCard = require("./routes/scoreCard"),
    scoreCardDetail = require("./routes/scoreCardDetail"),
    scoremanualaction = require("./routes/scoremanualactions"),
    scoreCardCall = require("./routes/scoreCardCall");
    ldm = require("./routes/ldm");
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
    app.set('etag', false);
}
app.use(cors());
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride());
app.use(multer({
    dest: d.file_upload,
    rename: function(fieldname, filename) {
        var newName = randomString.generate(8);
        return newName + "_" + Date.now();
    },
    onFileUploadStart: function(file) {
        console.log(file.originalname + ' is starting ...');
    },
    onFileUploadComplete: function(file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path);
        done = true;
    }
}));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    // Set to true if you need the website to include cookies in the requests sent to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(passport.initialize());

//Check internal endpoint access
app.use(function(req, res, next) {
    var url_arr = req.url.split('/');
    if (url_arr.length >= 2) {
        if (url_arr[1] === 'internal') {
            console.log('headers are ' + JSON.stringify(req.headers.internal_key))
            if (c[envVar].internal_key === req.headers.internal_key) {
                next();
            } else {
                res.status(403);
                console.log('403 Forbidden.');
                res.send({ status: 'error', err: 'forbidden', json: {} });
            }
        } else {
            next();
        }
    } else {
        next();
    }
});

/* =================== Non authenticated route =============================== */
app.use('/', routes);
app.use('/api_status', api_status);
app.use('/emaildigest/1/groupcallcounts', groupcallcounts);
app.use('/emaildigest/1/groupuseremails', groupuseremails);
app.use('/emaildigest/1/groupcallswithscores', groupcallswithscores);
//app.use('/parentemails', parentemails);
app.use('/emaildigest/1/mongoemaildigeststoresummary', mongoemaildigeststoresummary);
app.use('/emaildigest/1/emaildigesttasks', emaildigesttasks);
app.use('/emaildigest/1/organizationalunits', organizationalunits);
app.use('/emaildigest/1/getorganizationalunitsbyname', getorganizationalunitsbyname);
app.use('/emaildigest/1/tester', tester);
app.use('/emaildigest/1/organizationalunitsbyusername', organizationalunitsbyusername);
app.use('/dailysums', dailysums);
app.use('/login', login);
app.use('/oauth/token', oauth2.token);
app.use('/v1/signup', signup);
app.use('/v1/lookerAPI', lookerAPI);
app.use('/v1/support', support);
app.use('/v1/ldm', ldm);





/* =================== Apply to all routes =============================== */
app.all('/v1/*', [require('./middlewares/validateData')]);
app.use('/v1/*', passport.authenticate('bearer', { session: false }));
/* NOTE: the bearer strategy will set two arrays of values that can be consumed by any route within /v1/ which is as follows:
	req.user = [{"timezone":"MST","last_name":"Gates","first_name":"Bill","tl_id":8,"ou_name":"Blingy Marketing LLC","ou_id":8,"user_id":1}]
	req.authInfo = [{"tag":7,"menu":7,"ca":7,"number":"7:5:3000","orgunit":7,"googleua":6,"api":6,"webhook":6,"callaction":7,"dni":7,"callflow":7,"callrec":7,"report":7,"user":"7:16:99999999","campaign":"7:13:99999999","edigest":7}]

	The 'user' is user related data, including some org unit info.  The 'authInfo' contains the users scopes that they have permission for
*/
// modify variables returned by bearer for backward compatibility
app.use('/v1/*', function(req, res, next) {
    req.userid = req.user.user_id;
    req.ouid = req.user.ou_id;
    req.orglist = req.user.orglist;
    req.camplist = req.user.camplist;
    req.is_migrated = req.user.is_migrated;
    req.prompts = req.user.prompts;
    req.whispers = req.user.whispers;
    req.voicemails = req.user.voicemails;
    

    next();
});

//static resources for stylesheets, images, javascript files
app.use(express.static(path.join(__dirname, 'public')));

/*app.use(function(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
    //res.redirect('/auth');
    res({ Error: 'Not authorized'});
});
*/
app.all('/internal/provisionedroute/create', [require('./middlewares/validateData')]);
app.use('/internal/provisionedroute/create', passport.authenticate('bearer', { session: false }));
app.use('/internal/provisionedroute/create', function(req, res, next) {
    req.userid = req.user.user_id;
    req.ouid = req.user.ou_id;
    req.orglist = req.user.orglist;
    req.camplist = req.user.camplist;
    next();
});
app.all('/internal/campaign/create', [require('./middlewares/validateData')]);
app.use('/internal/campaign/create', passport.authenticate('bearer', { session: false }));
app.use('/internal/campaign/create', function(req, res, next) {
    req.userid = req.user.user_id;
    req.ouid = req.user.ou_id;
    req.orglist = req.user.orglist;
    req.camplist = req.user.camplist;
    next();
});
app.all('/internal/campaign/status', [require('./middlewares/validateData')]);
app.use('/internal/campaign/status', passport.authenticate('bearer', { session: false }));
app.use('/internal/campaign/status', function(req, res, next) {
    req.userid = req.user.user_id;
    req.ouid = req.user.ou_id;
    req.orglist = req.user.orglist;
    req.camplist = req.user.camplist;
    next();
});
//Make our db accessible to our router
app.use(function(req, res, next) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
        console.log('\n**********');
        console.log('Time: ' + req._startTime);
        console.log('ENV: ' + process.env.NODE_ENV);
        console.log('Req url: ' + req.method + ':' + req.url);
        console.log('Req Headers: ' + JSON.stringify(req.headers));
        console.log('Req Params: ' + JSON.stringify(req.params));
        console.log('Req Body: ' + JSON.stringify(req.body) + '\n----\n');
    }
    next();
});

// ----- set the directory path for routes ----------------------------
app.use('/ral', ral);
app.use('/security', security);

// ----- secured routes -----------------------------------------------
app.use('/v1/analytic', analytic);
app.use('/v1/bandwidth', bandwidth);
app.use('/v1/shoutpoint', shoutpoint);
app.use('/v1/billing', billing);
app.use('/v1/blacklist', blacklist);
app.use('/v1/call', call);
app.use('/v1/callaction', callaction);
app.use('/v1/calldetail', calldetail);
app.use('/v1/callflow', callflow);
app.use('/v1/callflowrecording', callflowrecording);
app.use('/v1/campaign', campaign);
app.use('/v1/channel', channel);
app.use('/v1/conversation' , conversation);
app.use('/v1/doubleclick', doubleclick);
app.use('/v1/dniorgunit', dniorgunit);
app.use('/v1/dnisetting', dnisetting);
app.use('/v1/email', email);
app.use('/v1/emailtemplate', emailtemplate);
app.use('/v1/geolookup', geolookup);
app.use('/v1/indicator', indicator);
app.use('/v1/industry', industry);
app.use('/v1/location', location);
app.use('/v1/locationroute', locationroute);
app.use('/v1/logactivity', logactivity);
app.use('/v1/numberpool', numberpool);
app.use('/v1/orgunit', orgunit);
app.use('/v1/phonenumber', phonenumber);
app.use('/v1/provisionedroute', provisionedroute);
app.use('/v1/report', report);
app.use('/v1/role', role);
app.use('/v1/referral', referralCampaign);
app.use('/v1/session', session);
app.use('/v1/subscription', subscription);
app.use('/v1/tag', tag);
app.use('/v1/customsource', customsource);
app.use('/v1/tester', tester);
app.use('/v1/user_noemail', user);
app.use('/v1/user', user);
app.use('/v1/useraccess', useraccess);
app.use('/v1/vitelity', vitelity);
app.use('/v1/webhook', webhook);
app.use('/v1/looker', looker);
app.use('/v1/callerprivacy', callerprivacy);
app.use('/v1/whitelabel', whitelabel);
app.use('/v1/zuora', zuora);
app.use('/v1/userpermissions', userPermissions);
app.use('/v1/distributionlist', distributionlist);
app.use('/v1/schedule', schedule);
app.use('/v1/campaignCallflow', campaignCallflow);
app.use('/v1/defgroupsetting', defgroupsetting);
app.use('/v1/scorecard', scoreCard);
app.use('/v1/scoreCardCall', scoreCardCall);
app.use('/v1/scorecarddetail', scoreCardDetail);
app.use('/v1/scoremanualaction', scoremanualaction);

//Internal endpoints
app.use('/internal/', internal);


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.status(404);
    console.log('404 not found.');
    res.send({ error: 'Not found 404' });
    return;
});

/// error handlers

// development error handler - will print stacktrace
if (app.get('env') === 'development' || app.get('env') === 'local') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler - no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
