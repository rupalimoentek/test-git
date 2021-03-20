-- ====== welcome (includes domain) ========================================================

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
                                   <p>You''re almost done! Once you click on the link below, you''ll be directed to a page where you can create a new Password and then your account will be activated.
                                   <a href="https://[[domain]][[url]]">Click Here</a> or copy and paste the url below into your browser''s address bar.</p>
                        <p>https://[[domain]][[url]]</p>

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

                                                <span style="color:#efefef;">You are receiving this email because<br/>
                                                1.) You''re an awesome customer and<br/>
                                                2.) You''re setup to receive these emails<br/>

                                                <br/>
                                                Want to be removed? No problem, contact your company admin or customer service.</span>

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
</html>', dynamic_field='{first_name,last_name,username,ct_user_id,ct_user_ou_id,url,domain}',
    field_display='{"First Name","Last Name","E-mail Address","User ID","Organization ID","Password Link Path","Domain Name"}' WHERE email_code='welcome';

-- ====== recover (includes domain) ========================================================

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
    <a href="https://[[domain]][[url]]">Click Here</a> or, copy and paste the url below into your browser''s address bar.
    </p>
                        			<p>https://[[domain]][[url]]</p>
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

                                                <span style="color:#efefef;">You are receiving this email because<br/>
                                                1.) You''re an awesome customer and<br/>
                                                2.) You''re setup to receive these emails<br/>

                                                <br/>
                                                Want to be removed? No problem, contact your company admin or customer service.</span>

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
</html>', dynamic_field='{first_name,last_name,username,ct_user_id,ct_user_ou_id,url,domain}',
field_display='{"First Name","Last Name","E-mail Address","User ID","Organization ID","Domain Name","Password Link Path"}' WHERE email_code='recover';

CREATE TABLE npa_blacklist (
    npa                         SMALLINT NOT NULL,
    PRIMARY KEY (npa)
);