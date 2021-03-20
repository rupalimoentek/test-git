var express = require('express'),
    signup = require('../controllers/signupController'),
    industry = require('../controllers/industryController'),
    ctUser = require('../controllers/ctUserController'),
    router = express.Router();


router.get('/', function(req,res){
  industry.getAction(req, function(data){
	 res.send(data);
   })
});

router.get('/:email', function(req,res){
    ctUser.getAction(req.params, function(data){
      if(data.err){res.send(err);}
      if(data.json.length>0)
      {
        res.send(false);
      }else
	     res.send(data);
    })
});

router.get('/npa/:number', function(req,res){
    signup.npanxxNpa(req.params.number, function(data){
      if(data.err){res.send(err);}
      console.log(data[0].count);
      if(data[0].count<1)
      {
        res.send(false);
      }else
       res.send(data);
    })
});

router.post('/', function(req,res){
   signup.postAction(req, function(data){
	 res.send(data);
   })
});

module.exports = router;
