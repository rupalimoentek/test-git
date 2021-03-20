/**
 * Created by davey on 11/17/15.
 */
var appModel        = require('../models/appModel.js'),
    async           = require('async'),
	nodemailer      = require("nodemailer"),
	smtpTransport   = require('nodemailer-smtp-transport'),
	htmlToText      = require('nodemailer-html-to-text').htmlToText,
	_               = require('underscore'),
	fs              = require("fs"),
	yaml            = require("js-yaml"),
	conf            = yaml.load(fs.readFileSync('config/config.yml')),
	envVar          = process.env.NODE_ENV;

var email = {
	/* Description of the values passed to this method:
		tmpl_name => <email_code> - the name of the e-mail master template email_code column in DB
		dyn_data => {<key>:<val>, <key>:<val>} - key/value pairs of the dynamic content with the key being the name of the variable (dynamic_field) and the associated value desired
		email_to => <email> - the e-mail address(es) the message will be sent to
		ouid => <org_unit_id> - this is optional, but allows for client defined templates to be used if defined.
	 */
	send: function(tmpl_name, dyn_data, email_to, ouid, res) {
		if (!tmpl_name) { return res('No template specified'); }
		console.log('TEMPLATE', tmpl_name, 'DYNAMIC DATA PASSED', dyn_data);

		async.waterfall([
            function (cb1) {
				if (ouid !== undefined && ouid !== '') {
		            var qry = "SELECT o.org_unit_id, owl.white_label_active, owl.domain_name FROM org_unit o LEFT JOIN org_white_label owl ON (o.org_unit_id=owl.org_unit_id) " +
			            "WHERE o.org_unit_id="+ouid+" OR o.org_unit_id=(SELECT org_unit_parent_id FROM org_unit WHERE org_unit_id="+ouid+") OR " +
			            "o.org_unit_id=(SELECT top_ou_id FROM org_unit WHERE org_unit_id="+ouid+") ORDER BY o.org_unit_id DESC";

					appModel.ctPool.query(qry, function(err, data) {
						if (err) { return cb1('Failed to execute white label org unit states. '+err); }
						if (data.length < 1) { return cb1('No matching Organizational Unit found in the system.'); }
						var tmp_ouid = '';

						async.each(data, function(row, cb2) {
							if (!tmp_ouid && row.white_label_active) { // first white label found that's active
								console.log('switching OUID from', ouid, 'to', row.org_unit_id);
								ouid = tmp_ouid = row.org_unit_id; // directly change the OU ID to use and set tmp_ouid so we don't overwrite
								if (row.domain_name !== null && row.domain_name !== '') { // have domain to use from white label
									console.log('Changing domain name', dyn_data.domain, 'to', row.domain_name);
									if (dyn_data.domain !== undefined) { dyn_data.domain = row.domain_name; } // set the dyn_data domain to the white label domain
								}
							}
							cb2(null);
						}, function(err) {
							if (err) { return cb1(err); }
							cb1(null);
						});
					});
				} else {
					cb1(null);
				}
			},
			function(cb3) {
				if (ouid === undefined || ouid === '') {
					var qry = "SELECT * FROM email_master em WHERE em.email_code='" + tmpl_name + "'";
				} else {
					var qry = "SELECT et.*, em.*, oga.*, owl.white_label_active FROM email_master em LEFT JOIN email_template et ON (em.master_id=et.master_id AND et.org_unit_id="+ouid+") " +
						"LEFT JOIN org_google_analytic oga ON (et.ga_id IS NOT NULL AND et.ga_id=oga.ga_id) " +
						"LEFT JOIN org_white_label owl ON (et.org_unit_id=owl.org_unit_id) WHERE em.email_code='" + tmpl_name + "'";
				}

				appModel.ctPool.query(qry, function(err, data) {
					if (err) { return cb3('Failed to retrieve the specified e-mail master template record for '+tmpl_name+'. '+err); }
					if (data.length < 1) { return cb3('Failed to find the specified e-mail master template'); }

					// remove all custom e-mail values if not active
					if (data[0].white_label_active !== undefined && !data[0].white_label_active) {
						delete data[0].html_copy;
						delete data[0].subject;
						delete data[0].email_from;
						delete data[0].ga_id;
					}

					// set the correct copy content and subject to use for the HTML and text only
					//noinspection JSUnresolvedVariable
					var eHtml = (data[0].html_copy ? data[0].html_copy : data[0].html_template),
					    eSubject = (data[0].subject ? data[0].subject : data[0].email_subject),
					    eFrom = (data[0].email_from ? '"'+data[0].email_from+'" ' : '')+'<no-reply@messages.services>';

					// check for Google Analytic link in template data
					// NOTE: for an example of use, reference 'caps' project and 'callAction.js' file on method 'emailAction'
					if (data[0].ga_id !== undefined && data[0].ga_id && tmpl_name === 'action_alert') {
						console.log('IS GOOGLE LINK');
						var fields = ['org_unit_name', 'campaign_name', 'provisioned_route_name', 'event_criteria', 'channel', 'cid'];
						_.each(fields, function(fld) {
							dyn_data[fld] = escape(dyn_data[fld]);
							dyn_data[fld] = dyn_data[fld].replace(/\%20/g," ");
						});
						data[0].dynamic_field = data[0].dynamic_field.concat(fields);

						// set what the link should be swapped for
						var gatag = '<img src="http://www.google-analytics.com/collect?'+data[0].static_string+'&cid=[[cid]]&tid='+data[0].tracking_id+'&el=[['+data[0].event_label+']]&cs=[['+
							data[0].campaign_source+']]&cn=[['+data[0].campaign_name+']]'+(data[0].custom_metric !== '' ? '&metric'+data[0].custom_metric+'=1' : '')+'" />';
						console.log('GOOGLE LINK CODE', gatag);
						var re = new RegExp('<\/body>','gi');
						if (re.test(eHtml)) {
							eHtml = eHtml.replace("/<\/body>/", gatag + '</body>'); // insert google analytics tracking tag
						} else {
							console.log('Appending');
							eHtml= eHtml+gatag; // append to end
						}
					}
					// cycle through all the defined dynamic field and substitute with values provided
					_.each(data[0].dynamic_field, function(key) {
						if (dyn_data.hasOwnProperty(key)) {
							var re = new RegExp("\\[\\[" + key + "\\]\\]", "g");
							eHtml = eHtml.replace(re, dyn_data[key]);
						}
					});
					var mailOptions = {
						from        : eFrom,
						to          : email_to,
						subject     : eSubject,
						replyTo     : (data[0].reply_to ? data[0].reply_to : eFrom),
						html        : eHtml
					};
					var transport = nodemailer.createTransport(smtpTransport({
						host        : 'localhost',
						port        : 25,
						ignoreTLS   : true,
						secure      : false
					}));
					transport.use('compile', htmlToText());
					console.log('Sending e-mail');
					transport.sendMail(mailOptions, function(err, res2) {
						if (err) { console.log('ERROR', err); }
						if (err) { return cb3('Failed to send e-mail. '+err); }
						console.log('Successfully sent', res2);
						cb3(null, res2);
					});
				});
			}
		], function(err, result) {
			if (err) { return res(err); }
			res(null, result);
		});
	},

	sendZuoraEmail: function(message, email_to, res) {
		var mailOptions = {
			from        : 'no-reply@convirza.com',
			to          : email_to,
			subject     : 'Error Notification',
			html        : message
		};
		var transport = nodemailer.createTransport(smtpTransport({
			host        : 'localhost',
			port        : 25,
			ignoreTLS   : true,
			secure      : false
		}));
		transport.use('compile', htmlToText());
		console.log('Sending e-mail');
		transport.sendMail(mailOptions, function(err, res2) {
			if (err) { return res('Failed to send e-mail. '+err); }
			console.log('Successfully sent', res2);
			res(null, res2);
		});
	},

	sendSupportEmail: function(subject, message, email_to, email_from, res) {
		console.log(email_from, email_to);
		var mailOptions = {
			from        : 'no-reply@messages.services',
			to          : email_to,
			replyTo     : email_from,
			subject     : subject,
			html        : message
		};
		var transport = nodemailer.createTransport(smtpTransport({
			host        : 'localhost',
			port        : 25,
			ignoreTLS   : true,
			secure      : false
		}));
		transport.use('compile', htmlToText());
		console.log('Sending e-mail');
		transport.sendMail(mailOptions, function(err, res2) {
			if (err) { return res('Failed to send e-mail. '+err); }
			console.log('Successfully sent', res2);
			res(null, res2);
		});
	},
};

module.exports = email;