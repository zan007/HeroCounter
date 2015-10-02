angular.module('dataSource', []).

factory('dataSource', ['$http', '$q', '$rootScope',
    function($http, $q, $rootScope) {
       
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
            }


        };
        /*$http.get('pictures').then(function(response) {
            var data = response.data;

            $rootScope.pictures = data;
           
            $rootScope.$broadcast('dataSource.ready');
        }).then(null, function() {
            $rootScope.$broadcast('dataSource.error');
        });*/

    }
]);
