var nodemailer = require('nodemailer');
var express = require('express');
var mailConfig = require('./config/mail'),
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');

var transporter = nodemailer.createTransport('smtps://' + mailConfig.address + ':' + mailConfig.pwd + '@smtp.gmail.com');

exports.sendRegisterLink = function(token, user, req) {
	
	var mailTemplate = fs.readFileSync(path.join(__dirname, 'mail_templates/registration-link.ejs'), 'utf-8');
	var activationLink = 'http://' + req.headers.host + '/#/activation?token=' + token;
	
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
};

exports.sendActivationReminder = function(newUserName, administratorsEmails, req){
	var mailTemplate = fs.readFileSync(path.join(__dirname, 'mail_templates/activation-reminder.ejs'), 'utf-8');
	var settingsLink = 'http://' + req.headers.host + '/#/settings';
	var mailModel = {
		name: newUserName,
		settingsLink: settingsLink
	};

	var htmlMailTemplate = ejs.render(mailTemplate, mailModel);
	//console.log('dypa',htmlMailTemplate);
	var mailOptions = {
		from: 'Hero-Counter 👥 <hero.counter.app@gmail.com>', // sender address
		to: administratorsEmails, // list of receivers
		subject: 'Activation reminder',
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
};