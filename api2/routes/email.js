/**
 * Created by davey on 11/19/15.
 */
var express = require('express'),
    email = require('../controllers/emailController'),
    router = express.Router();

/* The expected format to send to this function:
	{
		'template': <name_of_email_template>,
		'send_to': <email_address(es)>,
	    'org_unit_id': <org_unit_id> (optional)
		'dyn_data': {
			<key>:<value>,
			...
		}
	}
 */
router.post('/', function(req, res) {
	email.emailAction(req, function(err, data) {
		res.send({
			result: (err ? 'error' : 'success'),
			err: err,
			json: data
		});
	});
});

module.exports = router;