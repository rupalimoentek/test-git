UPDATE email_master SET html_template = '<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>Email</title>
	<style type="text/css">
		.ReadMsgBody {
			width: 100%;
			background-color: #ffffff;
		}

		.ExternalClass {
			width: 100%;
			background-color: #ffffff;
		}

		body {
			width: 100%;
			background-color: #ffffff;
			margin: 0;
			padding: 0;
			-webkit-font-smoothing: antialiased;
			font-family: Georgia, Times, serif
		}

		table {
			border-collapse: collapse;
		}

		@media only screen and (max-width: 640px) {
			body[yahoo] .deviceWidth {
				width: 440px !important;
				padding: 0;
			}

			body[yahoo] .center {
				text-align: center !important;
			}
		}

		@media only screen and (max-width: 479px) {
			body[yahoo] .deviceWidth {
				width: 280px !important;
				padding: 0;
			}

			body[yahoo] .center {
				text-align: center !important;
			}
		}
	</style>
</head>

<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" yahoo="fix"
	style="font-family: Georgia, Times, serif">
	<!-- Wrapper -->
	<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
		<tr>
			<td width="100%" valign="top" bgcolor="#ffffff" style="padding-top:20px">
				<!-- Start Header-->
				<table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth"
					style="margin:0 auto;">
					<tr>
						<td width="100%" bgcolor="#ffffff">
							<!-- Logo -->
							<table border="0" cellpadding="0" cellspacing="0" align="right" class="deviceWidth">
								<tr>
									<td style="padding:10px 20px 20px;" class="center">
										<img src="https://www.convirza.com/wp-content/themes/fluid-yeti/assets/img/header-logo.png"
											alt="" border="0" />
									</td>
								</tr>
							</table><!-- End Logo -->
						</td>
					</tr>
				</table><!-- End Header -->
				<!-- One Column -->
				<table width="580" class="deviceWidth" border="0" cellpadding="0" cellspacing="0" align="center"
					bgcolor="#eeeeed" style="margin:0 auto;">
					<tr>
						<td style="font-size: 13px; color: #959598; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px 8px 10px 8px"
							bgcolor="#fff">
							<table>
								<tr>
									<td valign="middle" style="padding:0 10px 10px 0"><span
											style="text-decoration: none; color: #272727; font-size: 18px; color: #272727; font-weight: bold; font-family:Arial, sans-serif ">Hi
											[[first_name]] [[last_name]],</span>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table><!-- End One Column -->
				<!-- 2 Column Images & Text Side by SIde -->
				<table width="580" border="0" cellpadding="0" cellspacing="0" align="center" class="deviceWidth"
					style="margin:0 auto;">
					<tr>
						<td
							style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding-top:10px">
							<p align="center">[[rule_str]]</p>
							<p align="center">ALERT: </p>
						</td>
					</tr>
					<tr>
						<td style="padding-bottom:10px">
							<table align="left" width="55%" cellpadding="0" cellspacing="0" border="0"
								class="deviceWidth">
								<tr>
									<td valign="top" align="center" class="center" style="padding-top:10px">
										<table
											style="font-size: 12px;margin:0px; font-weight: normal;font-family:Arial, sans-serif;line-height: 24px;"
											align="center">
											<tr>
												<td align="left" valign="top">Date/Time:</td>
												<td align="left" valign="top">[[call_started]]</td>
											</tr>
											<tr>
												<td align="left" valign="top">Campaign Name:</td>
												<td align="left" valign="top">[[campaign_name]]</td>
											</tr>
											<tr>
												<td align="left" valign="top">Caller:</td>
												<td align="left" valign="top">[[source]]</td>
											</tr>
											<tr>
												<td align="left" valign="top">Tracking Number Name:</td>
												<td align="left" valign="top">[[route_name]]</td>
											</tr>
											<tr>
												<td align="left" valign="top">Tracking Number:</td>
												<td align="left" valign="top">[[tracking]]</td>
											</tr>
											<tr>
												<td align="left" valign="top">Destination Number:</td>
												<td align="left" valign="top">[[ring_to]]</td>
											</tr>
											<tr>
												<td align="left" valign="top">Ad Source:</td>
												<td align="left" valign="top">[[ad_source]]</td>
											</tr>
											<tr>
												<td align="left" valign="top">Call duration:</td>
												<td align="left" valign="top">[[duration]]</td>
											</tr>
											<tr>
												<td align="left" valign="top">Customer location:</td>
												<td align="left" valign="top">[[caller_street]]</td>
											</tr>
											<tr>
												<td align="left" valign="top"></td>
												<td></td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							<table align="right" width="44%" cellpadding="0" cellspacing="0" border="0"
								class="deviceWidth">
								<tr>
									<td
										style="font-size: 12px; font-weight: normal; text-align: left; font-family:Arial, sans-serif; line-height: 24px; vertical-align: top; padding:10px">
										<p style="mso-table-lspace:0;mso-table-rspace:0; margin:0">Here is a link to
											listen to the call:</p>
										<a href="[[recording_url]]">[[recording_url]]</a>
										<p style="mso-table-lspace:0;mso-table-rspace:0; margin:0">This link will expire
											in 7 days.</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td>
							<div style="height:6px">&nbsp;</div>
						</td>
					</tr>
				</table><!-- End 2 Column Images & Text Side by SIde -->
				<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
				<table width="580" cellpadding="0" cellspacing="0" align="center" class="deviceWidth" bgcolor="#202022"
					style="margin:0 auto;">
				</table>
				<div style="height:15px;margin:0 auto;">&nbsp;</div><!-- spacer -->
				<!-- 4 Columns -->
				<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center"
					style="background-color:#363636;">
					<tr>
						<td style="padding:30px 0">
							<table width="580" border="0" cellpadding="10" cellspacing="0" align="center"
								class="deviceWidth" style="margin:0 auto;">
								<tr>
									<td>
										<table width="45%" cellpadding="0" cellspacing="0" border="0" align="left"
											class="deviceWidth">
											<tr>
												<td valign="top"
													style="font-size: 11px; color: #efefef; color:#ccc; font-family: Arial, sans-serif; padding-bottom:20px"
													class="center">

													<span style="color:#efefef;">You are receiving this email
														because<br />
														1.) You''re an awesome customer and<br />
														2.) You''re setup to receive these emails<br />

														<br />
														Want to be removed? No problem, contact your company admin or
														customer service.</span>

												</td>
											</tr>
										</table>
										<table width="40%" cellpadding="0" cellspacing="0" border="0" align="right"
											class="deviceWidth">
											<tr>
												<td valign="top"
													style="font-size: 11px; color: #f1f1f1; font-weight: normal; font-family:Arial, sans-serif; line-height: 26px; vertical-align: top; text-align:right"
													class="center">
													<a href="#"
														style="text-decoration: none; color: #fff; font-weight: bold; font-family:Arial, sans-serif; padding-top: 5px;">Convirza</a><br />
													<a href="#"
														style="text-decoration: none; color: #848484; font-weight: normal;">855-889-3939</a><br />
													<a href="#"
														style="text-decoration: none; color: #848484; font-weight: normal;">support@convirza.com</a>
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

</html>' WHERE email_code = 'action_alert';
