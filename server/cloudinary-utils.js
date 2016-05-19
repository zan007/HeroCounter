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
	upload: function (imgData, imageId, callback) {
		//var decodedImg = decodeBase64Image(imgData);

		cloudinary.v2.uploader.upload(imgData, {public_id: imageId}, function (error, result) {
			console.log('Cloudinary photo uploaded result:');
			console.log(result);
			if (result) {
				callback(null, result);
			}
			else {
				console.log('error uploading', error);
				callback('Error uploading');
			}
		});
	},
	delete: function (imageId, callback) {
		cloudinary.uploader.destroy(imageId, function (result) {
			if (result) {
				callback(null, result);
			} else {
				callback('Error deleting old avatar');
			}
		}, {invalidate: true});
	}
};