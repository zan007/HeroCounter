$('body').append($(document.createElement('style')).text(".hide{display:none!important;} .show{display: block!important;} #token-input{width: 75%;-webkit-appearance: none;-webkit-border-radius: 3px;-moz-border-radius: 3px;border-radius: 3px;border: 0;margin: 10px 5px;background-color: #3b6897;height: 30px;text-align: left;padding-left: 20px;padding-right: 20px;line-height: 30px;color: white;}#save-token{    border: 0;width: 150px;height: 30px;background-color: #129fdd;color: white;margin-top: 10px;margin-bottom: 10px;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;margin-left:30px;} .logo-title{color: #13a4e4;} div.settingsBoxRegroup{width:210px;z-index:391;background:#222;background-color: rgba(39, 84, 130, 0.6);border-radius: 3px;color:#fff;font-family:Verdana, Arial, sans-serif;font-size:11px;position:absolute;padding:10px;}"));
g.loadQueue.push({
	fun: function() {
		new(function() {
			_this = this;

			var call = function(url, data, successCallback, errorCallback) {

				$.ajax({
					url: 'http://hero-counter.herokuapp.com' + url,
					success: function(result) {
						var resultJson = JSON.parse(result.response);
						successCallback(resultJson.message);
					},
					error: function(result) {
						var resultJson = JSON.parse(result.response);
						errorCallback(resultJson.message);
					},
					data: data,
					type: 'POST',
					crossDomain: true,
					dataType: 'application/json'
				});
			};
			var isGuest = true;
			var oldFight = fight;
			var creatureName = '';
			var canSendRequest = false;

			fight = function(e) {
				var pvp = false;
				if (e.myteam && e.w) {
					for (var i in e.w) {
						if (!e.w[i] || e.w[i].team == e.myteam) continue;
						if (i > 0 && !pvp) {
							pvp = true;
						} else {
							var npc = g.npc[Math.abs(i)];
							if (npc) {
								var rank, index;
								if (npc.wt >= 100) {
									index = 8;
									rank = 't';
									canSendRequest = true;
									creatureName = npc.nick;
								}
								else if (npc.wt >= 79) {
									index = 7;
									rank = 'h';
									canSendRequest = true;
									creatureName = npc.nick;
								}
								else if (npc.wt >= 30) {
									index = false;
									rank = false;
								}
								else if (npc.wt >= 20) {
									index = 6;
									rank = 'e2';
								}
								else if (npc.wt >= 10) {
									index = 5;
									rank = 'e';
								}
								else {
									index = 4;
									rank = 'n';
								}


							}
						}
					}


				}
				oldFight(e);
			}

			var settingsBox = $(document.createElement('div')).addClass('settingsBoxRegroup').css({
				'padding': '5px'
			}).draggable({
				stop: function() {
					_this.saveSettings()
				}
			});
			var regroupCheckbox = $(document.createElement('input')).attr({
				id: 'regroupCheckbox',
				name: 'regroupCheckbox',
				value: 'regroupCheckboxVal',
				type: 'checkbox'
			}).css({
				'padding': '1px',
				'width': '40px',
				'color': '#00ff00'
			}).change(function() {
				_this.saveSettings()
			});
			settingsBox.append('<b class="logo-title">HeroCounter</b><span style="color: #fff!important;font-size: 12px;float:right;"><a id="toggle-link"></a></span><br /><br /><div id="box-content"><div>Wklej tutaj token ze swojego konta heroCounter dostępny w sekcji ustawienia aby móc rejestrować walki</div><div><input placeholder="user token" id="token-input" type="text" size=30/></div><button id="save-token">Zapisz</button><br /><div id="request-console" style="height: 40px;"></div></div><div>Wysylaj informacje do uzytkownikow HeroCounter: </div>').append(regroupCheckbox);
			$('body').append(settingsBox);
			$('#toggle-link').text('Rozwiń').click(function(){

				$('#box-content').toggleClass('hide');
				var linkObj = $('#toggle-link');
				if(linkObj.text() === 'Zwiń') {
					linkObj.text('Rozwiń');
				} else {
					linkObj.text('Zwiń');
				}

			});
			$('#box-content').addClass('hide');

			var doubleSendBlock = false;
			var regroupCheckboxVal = $('#regroupCheckbox').is(':checked');
			var saveSettings = this.saveSettings = function() {
				var settings = 'top:' + settingsBox.offset().top + '|left:' + settingsBox.offset().left + '|value:' + $('#regroupCheckbox').is(':checked') + '|token:' + $('#token-input').val();
				var d = new Date();
				d.setTime(d.getTime() + 3600000 * 24 * 30)
				setCookie('__regroup', settings, d, false, false, false);
			}
			this.readSettings = function() {
				var settings = getCookie('__regroup')
				if (settings) {
					settings = settings.split('|');
					for (i = 0; i < settings.length; i++) {
						var pair = settings[i].split(':');
						switch (pair[0]) {
							case 'top':
								settingsBox.css('top', pair[1] + 'px');
								break;
							case 'left':
								settingsBox.css('left', pair[1] + 'px');
								break;
							case 'value':

								if (pair[1] == "true") {
									$('#regroupCheckbox').attr('checked', 'checked');
								}
								break;
							case 'token':
								if (pair[1]) {
									$('#token-input').attr('value', pair[1]);
								}
						}
					}
				}
			}
			this.readSettings();
			$('#save-token').click(function(){
				saveSettings()
			});


			this.finishBattle = function() {
				var oldBattleMsg = battleMsg;

				battleMsg = function(c, t) {
					regroupCheckboxVal = $('#regroupCheckbox').is(':checked');
					if (c.indexOf("winner=") >= 0 && regroupCheckboxVal) {
						var currentGroup = [];
						if (c.indexOf(hero.nick) >= 0) {
							_g("fight&a=quit");

							for (party in g.party) {
								var playerLvl = '';

								if(g.other[party]) {
									playerLvl = g.other[party].lvl;
								} else if(hero.id === party) {
									playerLvl = hero.lvl;
								}

								currentGroup.push({
									name: g.party[party].n,
									lvl: playerLvl
								})
							}

							var data = {
								token: $('#token-input').val(),
								nick: hero.nick,
								creature: creatureName,
								guest: hero.guest,
								group: currentGroup.length > 0 ? currentGroup : {name: hero.nick, lvl: hero.lvl},
								place: map.name,
							}

							if(canSendRequest) {
								console.log(data);
								call('/registerEvent', data, function (message) {
									$('#request-console').text('Informacje o walce wysłane').css({color: 'green'});
									canSendRequest = false;
								}, function (message) {
									$('#request-console').text('Błąd podczas wysyłania: ' + message).css({color: 'red'});
									canSendRequest = false;
								});
							}
						}

					}
					return oldBattleMsg(c, t);
				}
			}

			this.run = function() {
				this.finishBattle();
			}
		})().run();
	},
	data: ""
});
