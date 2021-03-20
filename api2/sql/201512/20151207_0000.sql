-- Google Analytics tracking table

CREATE TYPE gatag AS ENUM ('org_unit_name', 'campaign_name', 'provisioned_route_name', 'event_criteria', 'channel');

CREATE TABLE org_google_analytic (
    ga_id                       SERIAL NOT NULL,
    org_unit_id                 INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    tracking_id                 VARCHAR(128),
    event_label                 gatag,
    campaign_source             gatag,
    campaign_name               gatag,
    custom_metric               SMALLINT DEFAULT NULL,
    static_string               VARCHAR(128),
    PRIMARY KEY (ga_id)
);

ALTER TABLE email_template ADD COLUMN ga_id INT DEFAULT NULL REFERENCES org_google_analytic (ga_id) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO email_master(master_id, email_code, email_name, email_desc, email_active, dynamic_field, field_display, html_template, email_created, email_modified, email_subject) VALUES
    (1, 'welcome', 'New User Welcome', 'Upon creation of a user account this e-mail will be sent with a link to change their password', true,
        '{first_name,last_name,url,username,ct_user_id,ct_user_ou_id}', '{"First Name","Last Name","Password Link","E-mail Address","User ID","Organization ID"}', '<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Email</title>
<style type="text/css">
	.ReadMsgBody {width: 100%; background-color: #ffffff;}
	.ExternalClass {width: 100%; background-color: #ffffff;}
	body	 {width: 100%; background-color: #ffffff; margin:0; padding:0; -webkit-font-smoothing: antialiased;font-family: Georgia, Times, serif}
	table {border-collapse: collapse;}
	@media only screen and (max-width: 640px)  {
					body[yahoo] .deviceWidth {width:440px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
	@media only screen and (max-width: 479px) {
					body[yahoo] .deviceWidth {width:280px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
</style>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" yahoo="fix" style="font-family: Georgia, Times, serif">
<!-- Wrapper -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
	<tr>
		<td width="100%" valign="top" bgcolor="#ffffff" style="padding-top:20px">
			<!-- Start Header-->
			<table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
				<tr>
					<td width="100%" bgcolor="#ffffff">
                        <!-- Logo -->
                        <table border="0" cellpadding="0" cellspacing="0" align="right" class="deviceWidth">
                            <tr>
                                <td style="padding:10px 20px 20px;" class="center">
                                    <img src="https://www.convirza.com/wp-content/themes/fluid-yeti/assets/img/header-logo.png" alt="" border="0" />
                                </td>
                            </tr>
                        </table><!-- End Logo -->
					</td>
				</tr>
			</table><!-- End Header -->
			<!-- One Column -->
			<table width="580"  class="deviceWidth" border="0" cellpadding="0" cellspacing="0" align="center" bgcolor="#eeeeed" style="margin:0 auto;">
                <tr>
                    <td style="font-size: 13px; color: #959598; font-weight: normal; text-align: left; font-family: Georgia, Times, serif; line-height: 24px; vertical-align: top; padding:10px 8px 10px 8px" bgcolor="#fff">
                        <table>
                            <tr>
                                <td valign="middle" style="padding:0 10px 10px 0"><span style="text-decoration: none; color: #272727; font-size: 18px; color: #272727; font-weight: bold; font-family:Arial, sans-serif ">Welcome to Convirza for Advertisers, [[first_name]]!</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
			</table><!-- End One Column -->

            <!-- 2 Column Images & Text Side by SIde -->
            <table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
                <tr>
                    <td style="padding:10px 0">

                        <table align="right" width="99%" cellpadding="0" cellspacing="0" border="0" class="deviceWidth">
                            <tr>
                                <td style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px">
                                   <p>You''re almost done! Once you click on the link below, you''ll be directed to a page where you can create a new Password and then your account will be activated. <a href="[[url]]">Click Here</a> or copy and paste the url below into your browser''s address bar.</p>
                        <p>[[url]]</p>

                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td><div style="height:6px">&nbsp;</div></td>
                </tr>
            </table><!-- End 2 Column Images & Text Side by SIde -->
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
                <table width="580" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" bgcolor="#202022" style="margin:0 auto;">
                </table>
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
			<!-- 4 Columns -->
			<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" style="background-color:#363636;">
				<tr>
					<td style="padding:30px 0">
                        <table width="580" border="0" cellpadding="10" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
                            <tr>
                                <td>
                                    <table width="45%" cellpadding="0" cellspacing="0"  border="0" align="left" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #efefef; color:#ccc; font-family: Arial, sans-serif; padding-bottom:20px" class="center">

                                                You are receiving this email because<br/>
                                                1.) You''re an awesome customer and<br/>
                                                2.) You''re setup to receive these emails<br/>

                                                <br/>
                                                Want to be removed? No problem, contact your company admin or customer service.

                                            </td>
                                        </tr>
                                    </table>
                                    <table width="40%" cellpadding="0" cellspacing="0"  border="0" align="right" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #f1f1f1; font-weight: normal; font-family:Arial, sans-serif; line-height: 26px; vertical-align: top; text-align:right" class="center">
                                                <a href="#" style="text-decoration: none; color: #fff; font-weight: bold; font-family:Arial, sans-serif; padding-top: 5px;">Convirza</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">855-889-3939</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">support@convirza.com</a>
                                            </td>
                                        </tr>
                                    </table>
                        		</td>
                        	</tr>
                        </table>
                    </td>
                </tr>
            </table><!-- End 4 Columns -->
		</td>
	</tr>
</table> <!-- End Wrapper -->
<div style="display:none; white-space:nowrap; font:15px courier; color:#ffffff;">
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
</div>
</body>
</html>', '2015-11-18', NULL, 'Welcome');


INSERT INTO email_master VALUES (2, 'recover', 'Recover Password', 'Message used to recover a lost or forgotten password for an account and provides a link to reset it', true, '{first_name,last_name,url,username,ct_user_id,ct_user_ou_id}', '{"First Name","Last Name","Password Link","E-mail Address","User ID","Organization ID"}', '<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Email</title>
<style type="text/css">
	.ReadMsgBody {width: 100%; background-color: #ffffff;}
	.ExternalClass {width: 100%; background-color: #ffffff;}
	body	 {width: 100%; background-color: #ffffff; margin:0; padding:0; -webkit-font-smoothing: antialiased;font-family: Georgia, Times, serif}
	table {border-collapse: collapse;}
	@media only screen and (max-width: 640px)  {
					body[yahoo] .deviceWidth {width:440px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
	@media only screen and (max-width: 479px) {
					body[yahoo] .deviceWidth {width:280px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
</style>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" yahoo="fix" style="font-family: Georgia, Times, serif">
<!-- Wrapper -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
	<tr>
		<td width="100%" valign="top" bgcolor="#ffffff" style="padding-top:20px">
			<!-- Start Header-->
			<table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
				<tr>
					<td width="100%" bgcolor="#ffffff">
                        <!-- Logo -->
                        <table border="0" cellpadding="0" cellspacing="0" align="right" class="deviceWidth">
                            <tr>
                                <td style="padding:10px 20px 20px;" class="center">
                                    <img src="https://www.convirza.com/wp-content/themes/fluid-yeti/assets/img/header-logo.png" alt="" border="0" />
                                </td>
                            </tr>
                        </table><!-- End Logo -->
					</td>
				</tr>
			</table><!-- End Header -->
			<!-- One Column -->
			<table width="580"  class="deviceWidth" border="0" cellpadding="0" cellspacing="0" align="center" bgcolor="#eeeeed" style="margin:0 auto;">
                <tr>
                    <td style="font-size: 13px; color: #959598; font-weight: normal; text-align: left; font-family: Georgia, Times, serif; line-height: 24px; vertical-align: top; padding:10px 8px 10px 8px" bgcolor="#fff">
                        <table>
                            <tr>
                                <td valign="middle" style="padding:0 10px 10px 0"><span style="text-decoration: none; color: #272727; font-size: 18px; color: #272727; font-weight: bold; font-family:Arial, sans-serif ">Change request for [[first_name]] [[last_name]],</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
			</table><!-- End One Column -->
            <!-- 2 Column Images & Text Side by SIde -->
            <table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
                <tr>
                    <td style="padding:10px 0">
                        <table align="right" width="99%" cellpadding="0" cellspacing="0" border="0" class="deviceWidth">
                            <tr>
                                <td style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px">
                                   <p>A request has been submitted to change the password for your account.  If this was not requested by you then
    you can simply ignore this message.  If you do want to change the password for your account you can click on the link below,
    that will direct you to a page where you can create a new Password.
    <a href="[[url]]">Click Here</a> or, copy and paste the url below into your browser''s address bar.
    </p>
                        			<p>[[url]]</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td><div style="height:6px">&nbsp;</div></td>
                </tr>
            </table><!-- End 2 Column Images & Text Side by SIde -->
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
                    <table width="580" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" bgcolor="#202022" style="margin:0 auto;">
                    </table>
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
			<!-- 4 Columns -->
			<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" style="background-color:#363636;">
				<tr>
					<td style="padding:30px 0">
                        <table width="580" border="0" cellpadding="10" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
                            <tr>
                                <td>
                                    <table width="45%" cellpadding="0" cellspacing="0"  border="0" align="left" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #efefef; color:#ccc; font-family: Arial, sans-serif; padding-bottom:20px" class="center">

                                                You are receiving this email because<br/>
                                                1.) You''re an awesome customer and<br/>
                                                2.) You''re setup to recieve these emails<br/>

                                                <br/>
                                                Want to be removed? No problem, contact your company admin or customer service.

                                            </td>
                                        </tr>
                                    </table>
                                    <table width="40%" cellpadding="0" cellspacing="0"  border="0" align="right" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #f1f1f1; font-weight: normal; font-family:Arial, sans-serif; line-height: 26px; vertical-align: top; text-align:right" class="center">

                                                <a href="#" style="text-decoration: none; color: #fff; font-weight: bold; font-family:Arial, sans-serif; padding-top: 5px;">Convirza</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">855-889-3939</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">support@convirza.com</a>
                                            </td>
                                        </tr>
                                    </table>
                        		</td>
                        	</tr>
                        </table>
                    </td>
                </tr>
            </table><!-- End 4 Columns -->
		</td>
	</tr>
</table> <!-- End Wrapper -->
<div style="display:none; white-space:nowrap; font:15px courier; color:#ffffff;">
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
</div>
</body>
</html>', '2015-11-18', NULL, 'Account Change Request');


INSERT INTO email_master VALUES (3, 'recording', 'Call Recording', 'Sent upon request, this sends an e-mail with a link of a call recording', true, '{name,message,s3URL}', '{"Senders Name","Message Content","Recording URL"}', '<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Email</title>
<style type="text/css">
	.ReadMsgBody {width: 100%; background-color: #ffffff;}
	.ExternalClass {width: 100%; background-color: #ffffff;}
	body	 {width: 100%; background-color: #ffffff; margin:0; padding:0; -webkit-font-smoothing: antialiased;font-family: Georgia, Times, serif}
	table {border-collapse: collapse;}
	@media only screen and (max-width: 640px)  {
					body[yahoo] .deviceWidth {width:440px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
	@media only screen and (max-width: 479px) {
					body[yahoo] .deviceWidth {width:280px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
</style>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" yahoo="fix" style="font-family: Georgia, Times, serif">
<!-- Wrapper -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
	<tr>
		<td width="100%" valign="top" bgcolor="#ffffff" style="padding-top:20px">
			<!-- Start Header-->
			<table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
				<tr>
					<td width="100%" bgcolor="#ffffff">
                        <!-- Logo -->
                        <table border="0" cellpadding="0" cellspacing="0" align="right" class="deviceWidth">
                            <tr>
                                <td style="padding:10px 20px 20px;" class="center">
                                    <img src="https://www.convirza.com/wp-content/themes/fluid-yeti/assets/img/header-logo.png" alt="" border="0" />
                                </td>
                            </tr>
                        </table><!-- End Logo -->
					</td>
				</tr>
			</table><!-- End Header -->
			<!-- One Column -->
			<table width="580"  class="deviceWidth" border="0" cellpadding="0" cellspacing="0" align="center" bgcolor="#eeeeed" style="margin:0 auto;">
                <tr>
                    <td style="font-size: 13px; color: #959598; font-weight: normal; text-align: left; font-family: Georgia, Times, serif; line-height: 24px; vertical-align: top; padding:10px 8px 10px 8px" bgcolor="#fff">
                        <table>
                            <tr>
                                <td valign="middle" style="padding:0 10px 10px 0"><span style="text-decoration: none; color: #272727; font-size: 18px; color: #272727; font-weight: bold; font-family:Arial, sans-serif ">Get in on the conversation,</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
			</table><!-- End One Column -->
            <!-- 2 Column Images & Text Side by SIde -->
            <table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
                <tr>
                    <td style="padding:10px 0">
                        <table align="right" width="99%" cellpadding="0" cellspacing="0" border="0" class="deviceWidth">
                            <tr>
                                <td style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px">
                                    <p>	[[name]] has sent you a call recording.<br /><br />
                                    	[[message]]<br /> <br />
                                        <a style="color:#fff;" href="[[s3URL]]">Click Here</a> or, copy and paste the url below into your browser''s address bar.
                                    </p>
                        			<p>[[s3URL]]</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td><div style="height:6px">&nbsp;</div></td>
                </tr>
            </table><!-- End 2 Column Images & Text Side by SIde -->
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
						<table width="580" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" bgcolor="#202022" style="margin:0 auto;">
						</table><!-- End 3 Small Images -->
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
			<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" style="background-color:#363636;">
				<tr>
					<td style="padding:30px 0">
                        <table width="580" border="0" cellpadding="10" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
                            <tr>
                                <td>
                                    <table width="45%" cellpadding="0" cellspacing="0"  border="0" align="left" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #efefef; color:#ccc; font-family: Arial, sans-serif; padding-bottom:20px" class="center">
                                                You are receiving this email because<br/>
                                                1.) You''re an awesome customer and<br/>
                                                2.) You''re setup to receive these emails<br/>
                                                <br/>
                                                Want to be removed? No problem, contact your company admin or customer service.
                                            </td>
                                        </tr>
                                    </table>
                                    <table width="40%" cellpadding="0" cellspacing="0"  border="0" align="right" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #f1f1f1; font-weight: normal; font-family:Arial, sans-serif; line-height: 26px; vertical-align: top; text-align:right" class="center">

                                                <a href="#" style="text-decoration: none; color: #fff; font-weight: bold; font-family:Arial, sans-serif; padding-top: 5px;">Convirza</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">855-889-3939</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">support@convirza.com</a>
                                            </td>
                                        </tr>
                                    </table>

                        		</td>
                        	</tr>
                        </table>
                    </td>
                </tr>
            </table><!-- End 4 Columns -->
		</td>
	</tr>
</table> <!-- End Wrapper -->
<div style="display:none; white-space:nowrap; font:15px courier; color:#ffffff;">
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
</div>
</body>
</html>', '2015-11-18', NULL, 'Call Recording');


INSERT INTO email_master VALUES (4, 'action_alert', 'Call Action Alert', 'Notification triggered by call action rules that sends various call information including a link to the recording - with Google Analytic tracking', true, '{first_name,last_name,str,call_started,campaign_name,source,route_name,tracking,ring_to,url,ga_link}', '{"First Name","Last Name","Call Action Rule","Call Start Timestamp","Campaign Name",Caller,"Route Name","Tracking Number","Destination Number","Recording URL","Google Analytics Link"}', '<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Email</title>
<style type="text/css">
	.ReadMsgBody {width: 100%; background-color: #ffffff;}
	.ExternalClass {width: 100%; background-color: #ffffff;}
	body	 {width: 100%; background-color: #ffffff; margin:0; padding:0; -webkit-font-smoothing: antialiased;font-family: Georgia, Times, serif}
	table {border-collapse: collapse;}
	@media only screen and (max-width: 640px)  {
					body[yahoo] .deviceWidth {width:440px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
	@media only screen and (max-width: 479px) {
					body[yahoo] .deviceWidth {width:280px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
</style>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" yahoo="fix" style="font-family: Georgia, Times, serif">
<!-- Wrapper -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
	<tr>
		<td width="100%" valign="top" bgcolor="#ffffff" style="padding-top:20px">
			<!-- Start Header-->
			<table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
				<tr>
					<td width="100%" bgcolor="#ffffff">
                        <!-- Logo -->
                        <table border="0" cellpadding="0" cellspacing="0" align="right" class="deviceWidth">
                            <tr>
                                <td style="padding:10px 20px 20px;" class="center">
                                    <img src="https://www.convirza.com/wp-content/themes/fluid-yeti/assets/img/header-logo.png" alt="" border="0" />
                                </td>
                            </tr>
                        </table><!-- End Logo -->
					</td>
				</tr>
			</table><!-- End Header -->
			<!-- One Column -->
			<table width="580"  class="deviceWidth" border="0" cellpadding="0" cellspacing="0" align="center" bgcolor="#eeeeed" style="margin:0 auto;">
                <tr>
                    <td style="font-size: 13px; color: #959598; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px 8px 10px 8px" bgcolor="#fff">
                        <table>
                            <tr>
                                <td valign="middle" style="padding:0 10px 10px 0"><span style="text-decoration: none; color: #272727; font-size: 18px; color: #272727; font-weight: bold; font-family:Arial, sans-serif ">Hi [[first_name]] [[last_name]],</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
			</table><!-- End One Column -->
            <!-- 2 Column Images & Text Side by SIde -->
            <table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
            	<tr>
                	<td style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding-top:10px">
						<p align="center">A call met the required threshold for notification.</p>
						<p align="center">ALERT: </p>
					</td>
                </tr>
                <tr>
                    <td style="padding-bottom:10px">
                        <table align="left" width="55%" cellpadding="0" cellspacing="0" border="0" class="deviceWidth">
                            <tr>
                                <td valign="top" align="center" class="center" style="padding-top:10px">
                                    <table style="font-size: 12px;margin:0px; font-weight: normal;font-family:Arial, sans-serif;line-height: 24px;" align="center">
                                        <tr>
                                            <td align="right">Date/Time:</td>
                                            <td>[[call_started]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Campaign Name:</td>
                                            <td>[[campaign_name]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Caller:</td>
                                            <td>[[source]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Route Name:</td>
                                            <td>[[route_name]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Tracking Number:</td>
                                            <td>[[tracking]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Destination Number:</td>
                                            <td>[[ring_to]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right"></td>
                                            <td></td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <table align="right" width="44%" cellpadding="0" cellspacing="0" border="0" class="deviceWidth">
                            <tr>
                                <td style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px">
                                    <p style="mso-table-lspace:0;mso-table-rspace:0; margin:0">Here is a link to listen to the call:</p>
                                    <a href="[[url]]">[[url]]</a>
                                    <p style="mso-table-lspace:0;mso-table-rspace:0; margin:0">This link will expire in 7 days.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td><div style="height:6px">&nbsp;</div></td>
                </tr>
            </table><!-- End 2 Column Images & Text Side by SIde -->
            <table width="580" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" bgcolor="#202022" style="margin:0 auto;">
            </table>
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
			<!-- 4 Columns -->
			<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" style="background-color:#363636;">
				<tr>
					<td style="padding:30px 0">
                        <table width="580" border="0" cellpadding="10" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
                            <tr>
                                <td>
                                    <table width="45%" cellpadding="0" cellspacing="0"  border="0" align="left" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #efefef; color:#ccc; font-family: Arial, sans-serif; padding-bottom:20px" class="center">

                                                You are receiving this email because<br/>
                                                1.) You''re an awesome customer and<br/>
                                                2.) You''re setup to receive these emails<br/>

                                                <br/>
                                                Want to be removed? No problem, contact your company admin or customer service.

                                            </td>
                                        </tr>
                                    </table>

                                    <table width="40%" cellpadding="0" cellspacing="0"  border="0" align="right" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #f1f1f1; font-weight: normal; font-family:Arial, sans-serif; line-height: 26px; vertical-align: top; text-align:right" class="center">

                                                <a href="#" style="text-decoration: none; color: #fff; font-weight: bold; font-family:Arial, sans-serif; padding-top: 5px;">Convirza</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">855-889-3939</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">support@convirza.com</a>
                                            </td>
                                        </tr>
                                    </table>
                        		</td>
                        	</tr>
                        </table>
                    </td>
                </tr>
            </table><!-- End 4 Columns -->
		</td>
	</tr>
</table> <!-- End Wrapper -->
<div style="display:none; white-space:nowrap; font:15px courier; color:#ffffff;">
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
</div>
[[ga_link]]
</body>
</html>', '2015-11-19', NULL, 'Call Action Email');


UPDATE email_master SET html_template='<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Email</title>
<style type="text/css">
	.ReadMsgBody {width: 100%; background-color: #ffffff;}
	.ExternalClass {width: 100%; background-color: #ffffff;}
	body	 {width: 100%; background-color: #ffffff; margin:0; padding:0; -webkit-font-smoothing: antialiased;font-family: Georgia, Times, serif}
	table {border-collapse: collapse;}
	@media only screen and (max-width: 640px)  {
					body[yahoo] .deviceWidth {width:440px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
	@media only screen and (max-width: 479px) {
					body[yahoo] .deviceWidth {width:280px!important; padding:0;}
					body[yahoo] .center {text-align: center!important;}
			}
</style>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" yahoo="fix" style="font-family: Georgia, Times, serif">
<!-- Wrapper -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
	<tr>
		<td width="100%" valign="top" bgcolor="#ffffff" style="padding-top:20px">
			<!-- Start Header-->
			<table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
				<tr>
					<td width="100%" bgcolor="#ffffff">
                        <!-- Logo -->
                        <table border="0" cellpadding="0" cellspacing="0" align="right" class="deviceWidth">
                            <tr>
                                <td style="padding:10px 20px 20px;" class="center">
                                    <img src="https://www.convirza.com/wp-content/themes/fluid-yeti/assets/img/header-logo.png" alt="" border="0" />
                                </td>
                            </tr>
                        </table><!-- End Logo -->
					</td>
				</tr>
			</table><!-- End Header -->
			<!-- One Column -->
			<table width="580"  class="deviceWidth" border="0" cellpadding="0" cellspacing="0" align="center" bgcolor="#eeeeed" style="margin:0 auto;">
                <tr>
                    <td style="font-size: 13px; color: #959598; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px 8px 10px 8px" bgcolor="#fff">
                        <table>
                            <tr>
                                <td valign="middle" style="padding:0 10px 10px 0"><span style="text-decoration: none; color: #272727; font-size: 18px; color: #272727; font-weight: bold; font-family:Arial, sans-serif ">Hi [[first_name]] [[last_name]],</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
			</table><!-- End One Column -->
            <!-- 2 Column Images & Text Side by SIde -->
            <table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
            	<tr>
                	<td style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding-top:10px">
						<p align="center">A call met the required threshold for notification.</p>
						<p align="center">ALERT: </p>
					</td>
                </tr>
                <tr>
                    <td style="padding-bottom:10px">
                        <table align="left" width="55%" cellpadding="0" cellspacing="0" border="0" class="deviceWidth">
                            <tr>
                                <td valign="top" align="center" class="center" style="padding-top:10px">
                                    <table style="font-size: 12px;margin:0px; font-weight: normal;font-family:Arial, sans-serif;line-height: 24px;" align="center">
                                        <tr>
                                            <td align="right">Date/Time:</td>
                                            <td>[[call_started]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Campaign Name:</td>
                                            <td>[[campaign_name]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Caller:</td>
                                            <td>[[source]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Route Name:</td>
                                            <td>[[route_name]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Tracking Number:</td>
                                            <td>[[tracking]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right">Destination Number:</td>
                                            <td>[[ring_to]]</td>
                                        </tr>
                                        <tr>
                                            <td align="right"></td>
                                            <td></td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <table align="right" width="44%" cellpadding="0" cellspacing="0" border="0" class="deviceWidth">
                            <tr>
                                <td style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px">
                                    <p style="mso-table-lspace:0;mso-table-rspace:0; margin:0">Here is a link to listen to the call:</p>
                                    <a href="[[recording_url]]">[[recording_url]]</a>
                                    <p style="mso-table-lspace:0;mso-table-rspace:0; margin:0">This link will expire in 7 days.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td><div style="height:6px">&nbsp;</div></td>
                </tr>
            </table><!-- End 2 Column Images & Text Side by SIde -->
            <table width="580" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" bgcolor="#202022" style="margin:0 auto;">
            </table>
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
			<!-- 4 Columns -->
			<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
				<tr>
					<td bgcolor="#363636" style="padding:30px 0">
                        <table width="580" border="0" cellpadding="10" cellspacing="0" align="center" class="deviceWidth" style="margin:0 auto;">
                            <tr>
                                <td>
                                    <table width="45%" cellpadding="0" cellspacing="0"  border="0" align="left" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #efefef; color:#ccc; font-family: Arial, sans-serif; padding-bottom:20px" class="center">

                                                You are receiving this email because<br/>
                                                1.) You''re an awesome customer and<br/>
                                                2.) You''re setup to receive these emails<br/>

                                                <br/>
                                                Want to be removed? No problem, contact your company admin or customer service.

                                            </td>
                                        </tr>
                                    </table>

                                    <table width="40%" cellpadding="0" cellspacing="0"  border="0" align="right" class="deviceWidth">
                                        <tr>
                                            <td valign="top" style="font-size: 11px; color: #f1f1f1; font-weight: normal; font-family:Arial, sans-serif; line-height: 26px; vertical-align: top; text-align:right" class="center">

                                                <a href="#" style="text-decoration: none; color: #fff; font-weight: bold; font-family:Arial, sans-serif; padding-top: 5px;">Convirza</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">855-889-3939</a><br/>
                                                <a href="#" style="text-decoration: none; color: #848484; font-weight: normal;">support@convirza.com</a>
                                            </td>
                                        </tr>
                                    </table>
                        		</td>
                        	</tr>
                        </table>
                    </td>
                </tr>
            </table><!-- End 4 Columns -->
		</td>
	</tr>
</table> <!-- End Wrapper -->
<div style="display:none; white-space:nowrap; font:15px courier; color:#ffffff;">
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
</div>
</body>
</html>', email_desc='Notification triggered by call action rules that sends various call information including a link to the recording - with Google Analytic tracking' WHERE master_id='4';
