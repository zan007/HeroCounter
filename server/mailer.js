var nodemailer = require('nodemailer');
var express = require('express');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');

var transporter = nodemailer.createTransport('smtps://hero.counter.app%40gmail.com:nodejsherocounterapp@smtp.gmail.com');

exports.sendRegisterLink = function(token, user, req) {
	/*var mailOptions = {
	    from: 'Hero-Counter 👥 <hero.counter.app@gmail.com>', // sender address
	    to: destination, // list of receivers
	    subject: 'Registration link',
	    generateTextFromHTML: true,
	    html: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/activate/' + token + '\n\n' +
          'If you did not request this, please ignore this email\n' // html body
	};*/
	
	var mailTemplate = fs.readFileSync(path.join(__dirname, 'mail_templates/registration-link.ejs'), 'utf-8');
	var activationLink = 'http://' + req.headers.host + '/activate/' + token;
	
	var htmlMailTemplate = ejs.render(mailTemplate, {name: user.name, activationLink: activationLink});
	//console.log('dypa',htmlMailTemplate);
	var mailOptions = {
	    from: 'Hero-Counter 👥 <hero.counter.app@gmail.com>', // sender address
	    to: user.email, // list of receivers
	    subject: 'Registration link',
	    generateTextFromHTML: true,
	    html: htmlMailTemplate
	};
	
	transporter.sendMail(mailOptions, function(error, info) {
		if(error) {
			console.log('email error', error);
			return {status: 'error'};
		}
		console.log('email success');
		return {
			status: 'success',
			info: info
		};

	});
}