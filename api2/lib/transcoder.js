var sox = require('sox');

var transcoder = {
  start: function(data, res){
    // these options are all default, you can leave any of them off

    var job = sox.transcode(data.src_path, data.dest_path, {
      sampleRate: 8000,
      format: data.newExt,
      channelCount: 1,
      bitRate: 192 * 1024,
      //compressionQuality: 5, // see `man soxformat` search for '-C' for more info
    });
    job.on('error', function(err) {
      res({message: err.stderr});
    });
    job.on('progress', function(amountDone, amountTotal) {

    });
    job.on('src', function(info) {

    });
    job.on('dest', function(info) {

    });
    job.on('end', function() {
      res(null, data.dest_path);
    });
    job.start();
  }
};
module.exports = transcoder;