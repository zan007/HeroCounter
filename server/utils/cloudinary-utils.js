/**
 * Created by pplos on 17.05.2016.
 */
var cloudinary = require('cloudinary'),
	cloudinaryConfig = require('./../config/cloudinary');


cloudinary.config({
	cloud_name: cloudinaryConfig.cloudName,
	api_key: cloudinaryConfig.apiKey,
	api_secret: cloudinaryConfig.apiSecret
});

module.exports = {
	upload: function (imgData, imageId, callback) {

		cloudinary.v2.uploader.upload(imgData, {public_id: imageId}, function (error, result) {
			if (result) {
				callback(null, result);
			}
			else {
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