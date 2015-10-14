angular.module('dataSource', []).

factory('dataSource', ['$http', '$q', '$rootScope', '$location', '$route',
    function($http, $q, $rootScope, $location, $route) {
       
        var model = {
            creatures: []
        };
        $rootScope.model = model;
        $rootScope.opened = false;
    
        var call = function(httpData, responseFn) {
            $rootScope.$broadcast('dataSource.start');
            var promise = $http(httpData).then(function(response) {
                var result;
                if (responseFn) {
                    result = responseFn(response.data, response.status, response.headers);
                }
                $rootScope.$broadcast('dataSource.stop');
                return result || response.data;
            }).then(null, function(reason) {
                $rootScope.$broadcast('dataSource.error');
                return $q.reject(reason);
            });
            return promise;
        };

        $http.get('init').then(function(response) {
            var data = response.data;

            model.creatures = data.creatures;
           
            $rootScope.$broadcast('dataSource.ready');
        }).then(null, function() {
            $rootScope.$broadcast('dataSource.error');
        });

        return {
            getPictures: function(categoryName) {
                
                    return call({
                        method: 'GET',
                        url: '/pictures',
                        params: {
                            category: categoryName
                        }
                    }, function(data) {
                        //prepareTransactions(transactions, model);
                       $rootScope.pictures = data;
                       
                    });
            },
            randPicture: function(sectionName){
                    return call({
                        method: 'POST',
                        url: '/rand-picture',
                        params: {
                            section: sectionName
                        }
                         
                    }, function(data) {
                       $rootScope.myPhoto = data.file;
                       console.log(data);
                       $rootScope.randFileName = data.fileName;
                        //prepareTransactions(transactions, model);
                       
                    });
            },
            defeatCreature: function(creature) {
                return call({ method: 'POST',
                                 url: '/defeat',
                                 data: { creatureName: creature.name }
                            }, function(data) {
                                $rootScope.model.creatures = data.creatures;
                                $rootScope.$broadcast('dataSource.ready');
                            });
            },
            init: function(){
                $http.get('init').then(function(response) {
                    var data = response.data;

                    model.creatures = data.creatures;
                   
                    $rootScope.$broadcast('dataSource.ready');
                }).then(null, function() {
                    $rootScope.$broadcast('dataSource.error');
                });
            },
            register: function(credential) {
                return call({ method: 'POST',
                                 url: '/signup',
                                 data: { 
                                    login: credential.login,
                                    password: credential.password
                                }
                            }, function(data) {
                                //res.redirect('http://localhost');
                                //$route.reload();
                                console.log('rejestracja');
                                //$location.path('/*');
                                console.log(data);
                            });
            },
            logg: function(credential){
                 return call({ method: 'POST',
                                 url: '/login',
                                 data: { 
                                    login: credential.login,
                                    password: credential.password
                                }
                            }, function(data) {
                                //res.redirect('http://localhost');
                                //$route.reload();
                                console.log('logowanie');
                                $location.path('/heroes');
                                
                                console.log(data);
                            });
            },
            isLoggedIn: function(){
                
                 // Initialize a new promise 
                 var deferred = $q.defer(); // Make an AJAX call to check if the user is logged in 
                $http.get('/isLoggedIn').success(function(user){ // Authenticated 
                    if (user !== '0') 
                        deferred.resolve(); // Not Authenticated 
                    else { 
                        deferred.reject(); 
                        $location.url('/login'); 
                    } 
                }); 
                return deferred.promise; 
            },
            logout: function() {
                return call({ method: 'GET',
                                 url: '/logout',
                                 data: { }
                            }, function(data) {
                                //res.redirect('http://localhost');
                                //$route.reload();
                                console.log('wylogowanie');
                                $location.path('/');
                                
                            });
            }
        };
    }
]);
