/**
 * Created by Aloha technology on 08/02/2017.
 */
 var    http = require('http'),
        crypto = require('crypto'),
        yaml = require("js-yaml"),
	    fs = require("fs"), 
        moment             = require('moment'),
        momentTimezone      = require('moment-timezone'),
        querystring = require('querystring'),
        config = yaml.load(fs.readFileSync("config/config.yml")),
        _ = require('underscore'),
        async = require('async'),
        envVar         = process.env.NODE_ENV,
        appModel = require('./appModel');

 function nonce(len) {
     var text = "";
     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

     for (var i = 0; i < len; i++)
     text += possible.charAt(Math.floor(Math.random() * possible.length));

     return text;
 }

 function forceUnicodeEncoding(string) {
     return decodeURIComponent(encodeURIComponent(string));
 }

 function created_signed_embed_url(options) {
     // looker options
    var secret = options.embed_secret,
        host   = options.host,

     // user options
        json_external_user_id  = JSON.stringify(options.external_user_id),
        json_first_name        = JSON.stringify(options.first_name),
        json_last_name         = JSON.stringify(options.last_name),
        json_permissions       = JSON.stringify(options.permissions),
        json_models            = JSON.stringify(options.models),
        json_group_ids         = JSON.stringify(options.group_ids),
        json_external_group_id = JSON.stringify(options.external_group_id || ""),
        json_user_attributes   = JSON.stringify(options.user_attributes || {}),
        json_access_filters    = JSON.stringify(options.access_filters),
        json_user_timezone     = JSON.stringify(options.user_timezone),

     // url/session specific options
        embed_path = '/login/embed/' + encodeURIComponent(options.embed_url),
        json_session_length = JSON.stringify(options.session_length),
        json_force_logout_login = JSON.stringify(options.force_logout_login),

     // computed options
        json_time  = JSON.stringify(Math.floor((new Date()).getTime() / 1000)),
        json_nonce = JSON.stringify(nonce(16));

     // compute signature
     var string_to_sign = "";
     string_to_sign += host + "\n";
     string_to_sign += embed_path + "\n";
     string_to_sign += json_nonce + "\n";
     string_to_sign += json_time + "\n";
     string_to_sign += json_session_length + "\n";
     string_to_sign += json_external_user_id + "\n";
     string_to_sign += json_permissions + "\n";
     string_to_sign += json_models + "\n";
     string_to_sign += json_group_ids + "\n";
     string_to_sign += json_external_group_id + "\n";
     string_to_sign += json_user_attributes + "\n";
     string_to_sign += json_access_filters;

     var signature = crypto.createHmac('sha1', secret).update(forceUnicodeEncoding(string_to_sign)).digest('base64').trim();

     // construct query string
     var query_params = {
         nonce: json_nonce,
         time: json_time,
         session_length: json_session_length,
         external_user_id: json_external_user_id,
         permissions: json_permissions,
         models: json_models,
         access_filters: json_access_filters,
         first_name: json_first_name,
         last_name: json_last_name,
         group_ids: json_group_ids,
         external_group_id: json_external_group_id,
         user_attributes: json_user_attributes,
         force_logout_login: json_force_logout_login,
         user_timezone: json_user_timezone,
         signature: signature
     };

     var query_string = querystring.stringify(query_params);
     return host + embed_path + '?' + query_string;
 }


function sample(req) {
    var org_list = (req.user.orglist).join(",");
    var data = req.body;
    var dashboardId = (data.dashboard_id) ? data.dashboard_id : 10;
    var sessionLength = 86400;
    var looker_host = config[envVar].LOOKER_HOST_URL;
    var api_host = config[envVar].API_HOST_URL;
    var access_token = req.headers.authorization.substring(6);
    if(data.isCompare && dashboardId ==10){ dashboardId = 7;}
	if(req.user.looker_old_ui) looker_ui = '';
	else looker_ui = '-next';
    var url_data = {
        host: looker_host,
        embed_secret: 'b66fe6f1a823c520982555e3eaaf81e927f50c04a9b17ed24a3c383587a77da3',
        external_user_id: req.user.user_id,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        group_ids: [],
        external_group_id: 'awesome_engineers',
        permissions: ['see_user_dashboards', 'see_lookml_dashboards', 'access_data', 'see_looks','see_drill_overlay','schedule_look_emails', 'schedule_external_look_emails','download_with_limit','download_without_limit','save_content','save_content','send_to_integration','send_to_sftp'],
        models: ['cfa_reports_model','convirza_model'],
        session_length: sessionLength,
        embed_url: '/embed/dashboards'+looker_ui+'/'+dashboardId+"?embed_domain=https://"+data.host+"&"+querystring.stringify(data.filters),
        force_logout_login: true,
        access_filters: {},
        user_attributes : {
            'host_name': data.host,
            'api_url':api_host,
            'ct_user_id':req.user.user_id,
            'access_token': access_token,
            'role_id': req.user.role_id
        },
        user_timezone: data.timezone
    };	
	if(req.user.style.org_logo != '') url_data.user_attributes.logo_url = req.user.style.org_logo;
    var url = created_signed_embed_url(url_data);
    return "https://" + url;
  }

var looker = {
 	  post: function(req, res){
      return res(null,sample(req));
 	}
 };
module.exports = looker;
