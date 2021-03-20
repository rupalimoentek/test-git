INSERT INTO email_master (
    email_code,
    email_name,
    email_desc,
    email_active,
    dynamic_field,
    field_display,
    html_template,
    email_created,
    email_subject
  )
VALUES(
    'score_card_updated',
    'Score Updated Notification',
    'Email notification for updated score',
    't',
    '{org_unit_name,call_title,scored_on,scored_by,score_value,source,score_card_outcomelabel,recording_url,least_score_criteria}',
    '{"Group Name","Call Title","Scored on","Scored by","Total Score","Out come","Least scored criteria","Link to listen to the call"}',
    '<!doctype html> <html xmlns="http://www.w3.org/1999/xhtml"> <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css"> 	.ReadMsgBody {width: 100%; background-color: #ffffff;} 	.ExternalClass {width: 100%; background-color: #ffffff;} 	body	 {width: 100%; background-color: #ffffff; margin:0; padding:0; -webkit-font-smoothing: antialiased;font-family: Georgia, Times, serif} 	table {border-collapse: collapse;} 	@media only screen and (max-width: 640px)  { 					body[yahoo] .deviceWidth {width:440px!important; padding:0;} 					body[yahoo] .center {text-align: center!important;} 			} 	@media only screen and (max-width: 479px) { 					body[yahoo] .deviceWidth {width:280px!important; padding:0;} 					body[yahoo] .center {text-align: center!important;} 			} </style>
    </head>
    <body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" yahoo="fix" style="font-family: Georgia, Times, serif">
    <table align="center" border="0" cellpadding="0" cellspacing="0" style="width:100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto; width:580px">
    <tbody>
    <tr>
    <td>
    <table align="right" border="0" cellpadding="0" cellspacing="0">
    <tbody>
    <tr>
    <td><img alt="" src="https://www.convirza.com/wp-content/themes/fluid-yeti/assets/img/header-logo.png" /></td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto; width:580px">
    <tbody>
    <tr>
    <td style="text-align:center; vertical-align:top">
    <table>
    <tbody>
    <tr>
    <td><strong>Hello,</strong></td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table>
    <tbody>
    <tr> 					</tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto; width:580px">
    <tbody>
    <tr>
    <td>
    <p style="text-align:center">ALERT:</p>
    </td>
    </tr>
    <tr>
    <td>
    <table align="left" border="0" cellpadding="0" cellspacing="0" style="width:55%">
    <tbody>
    <tr>
    <td>
    <table align="center" style="font-family:arial,sans-serif; font-size:12px; font-weight:normal; line-height:24px; margin:0px">
    <tbody>
    <tr>
    <td>Group Name:</td>
    <td>[[org_unit_name]]</td>
    </tr>
    <tr>
    <td>Call Title:</td>
    <td>[[call_title]]</td>
    </tr>
    <tr>
    <td>Scored on:</td>
    <td>[[scored_on]]</td>
    </tr>
    <tr>
    <td>Scored by:</td>
    <td>[[scored_by]]</td>
    </tr>
    <tr>
    <td>Total Score:</td>
    <td>[[score_value]]</td>
    </tr>
    <tr>
    <td>Outcome:</td>
    <td>[[score_card_outcomelabel]]</td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="right" border="0" cellpadding="0" cellspacing="0" style="width:44%">
    <tbody>
    <tr>
    <td style="text-align:left; vertical-align:top">
    <p>Here is a link to listen to the call:</p>
    [[recording_url]]  						
    <p>This link will expire in 7 days.</p>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <div style="height:6px"> </div>
    </td>
    </tr>
    </tbody>
    </table>
    <div style="height:15px;margin:0 auto"> </div>
    <table align="center" cellpadding="0" cellspacing="0" style="margin:0 auto; width:580px"> </table>
    <div style="height:15px;margin:0 auto"> </div>
    <table align="center" border="0" cellpadding="0" cellspacing="0" style="background-color:#363636; width:100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="10" cellspacing="0" style="margin:0 auto; width:580px">
    <tbody>
    <tr>
    <td>
    <table align="left" border="0" cellpadding="0" cellspacing="0" style="width:45%">
    <tbody>
    <tr>
    <td><span style="color:#efefef">You are receiving this email because<br /> 									1.) You' re an awesome customer
        and < br / > 2.
    ) You 're setup to receive these emails<br /> 									<br /> 									Want to be removed? No problem, contact your company admin or customer service.</span></td>
    </tr>
    </tbody>
    </table>
    <table align="right" border="0" cellpadding="0" cellspacing="0" style="width:40%">
    <tbody>
    <tr>
    <td style="text-align:right; vertical-align:top"><a href="#0.1_" style="text-decoration:none;color:#fff;font-weight:bold;font-family:Arial,sans-serif;padding-top:5px">Convirza</a><br /> 									<a href="#0.1_" style="text-decoration:none;color:#848484;font-weight:normal">855-889-3939</a><br /> 									<a href="#0.1_" style="text-decoration:none;color:#848484;font-weight:normal">support@convirza.com</a></td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <div style="display:none;white-space:nowrap;font:15px courier;color:#ffffff">- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>
    </body>
    </html>',
    '2020-01-27',
    'Call Score is updated'
);