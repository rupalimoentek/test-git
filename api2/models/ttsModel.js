// Imports the Google Cloud client library
var txtomp3 = require("../lib/textToMp3");

var getTTSmodel = {
    getMediaFromTTS: function (msg, res) {
      msg = getConvertedText(msg);
        txtomp3.getMp3(msg, function(err, binaryStream){
            if(err){
                res(err);
              return;
            }else{
                res(null, binaryStream.toString('base64'));
            }
          });
    }
    
}

function getConvertedText(text){
  var convertedText = '';
  _.each(text, function(char){
      if(char !== ' ' && !isNaN(char)){
          convertedText += ' '+char+' '; 
      }else{
          convertedText += char;
      }
  });
  return convertedText;
}

module.exports = getTTSmodel;
