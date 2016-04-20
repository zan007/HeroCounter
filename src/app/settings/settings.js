angular.module('settings', ['dataSource']).

controller('settingsCtrl', ['$scope', '$rootScope', 'dataSource',
    function($scope, $rootScope, dataSource) {
		if($rootScope.model.personalData.isAdministrator) {
			dataSource.refreshUsersToAccept();
		}
		$rootScope.$on('dataSource.ready', function() {
			$scope.model = $rootScope.model;
		});
		
    	/*w modelu uzytkownicy do zaakceptowania, jak nie ma praw to pusta lista,
    	wyswietlanie komunikatu ze nie ma uzytkownikow do zaakceptowania jak pusta lista i uzytkownik typu administrator*/
		$scope.changeAvatar = function(){

		};

		$scope.acceptUser = function(user){
			dataSource.acceptUserActivation(user);
		};

		$scope.rejectUser = function(user){
			dataSource.rejectUserActivation(user);
		};

		$scope.addHero = function(hero) {
			dataSource.addHero(hero);
		};

		$scope.removeHero = function(hero) {
			dataSource.removeHero(hero);
		};

		
    }
]);
