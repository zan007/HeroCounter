var server = require('../server'),
	nodemailer = require('nodemailer'),
	express = require('express'),
	mailConfig = require('./../config/mail'),
	fs = require('fs'),
	ejs = require('ejs'),
	path = require('path');

var transporter = nodemailer.createTransport('smtps://' + mailConfig.address + ':' + mailConfig.pwd + '@smtp.gmail.com');

exports.sendRegisterLink = function(token, user, req) {
	var lang = req.session.lang ? req.session.lang : 'pl';

	var mailTemplate = fs.readFileSync(path.join(server.dirName, 'mail_templates/registration-link.' + lang + '.ejs'), 'utf-8');
	var activationLink = 'http://' + req.headers.host + '/#/activation?token=' + token;
	
	var htmlMailTemplate = ejs.render(mailTemplate, {name: user.name, activationLink: activationLink});

	var mailOptions = {
	    from: 'Hero-Counter 👥 <hero.counter.app@gmail.com>', // sender address
	    to: user.email, // list of receivers
	    subject: lang == 'en' ? 'Registration link': 'Link rejestracyjny',
	    generateTextFromHTML: true,
	    html: htmlMailTemplate
	};
	
	transporter.sendMail(mailOptions, function(error, info) {
		if(error) {
			return {status: 'error'};
		}

		return {
			status: 'success',
			info: info
		};
	});
};

exports.sendActivationReminder = function(newUserName, administratorsEmails, req){
	var lang = req.session.lang ? req.session.lang : 'pl';
	var mailTemplate = fs.readFileSync(path.join(server.dirName, 'mail_templates/activation-reminder.' + lang + '.ejs'), 'utf-8');
	var settingsLink = 'http://' + req.headers.host + '/#/user-manager';
	var mailModel = {
		name: newUserName,
		settingsLink: settingsLink
	};

	var htmlMailTemplate = ejs.render(mailTemplate, mailModel);
	var mailOptions = {
		from: 'Hero-Counter 👥 <hero.counter.app@gmail.com>', // sender address
		to: administratorsEmails, // list of receivers
		subject: lang === 'en' ? 'Activation reminder': 'Przypomnienie o aktywowaniu użytkownika',
		generateTextFromHTML: true,
		html: htmlMailTemplate
	};

	transporter.sendMail(mailOptions, function(error, info) {
		if(error) {
			return {status: 'error'};
		}

		return {
			status: 'success',
			info: info
		};
	});
};