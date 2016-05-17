/**
 * Created by pplos on 17.05.2016.
 */
var cloudinary = require('cloudinary'),
	cloudinaryConfig = require('./config/cloudinary');


cloudinary.config({
	cloud_name: cloudinaryConfig.cloudName,
	api_key: cloudinaryConfig.apiKey,
	api_secret: cloudinaryConfig.apiSecret
});

var decodeBase64Image = function(dataString){
	var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
		response = {};

	if (matches.length !== 3) {
		return new Error('Invalid input string');
	}

	response.type = matches[1];
	response.data = new Buffer(matches[2], 'base64');
	return response;
};

module.exports = {
	upload: function(imgData, callback) {
		//var decodedImg = decodeBase64Image(imgData);

		cloudinary.uploader.upload(imgData, function (result) {
			console.log('Cloudinary photo uploaded result:');
			console.log(result);
			if (result) {
				callback(null, result);
			}
			else {
				callback('Error uploading to cloudinary');
			}
		});
	}
};