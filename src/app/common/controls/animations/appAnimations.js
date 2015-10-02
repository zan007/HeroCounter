angular.module('appAnimations', [])
  .animation('.list-out', ['$window',function($window) {
    return {
      start : function(element, done) {
        TweenMax.set(element, {position:'relative'});

        var duration = 1; 
        //we can use onComplete:done with TweenMax, but lets use
        //a delay value for testing purposes
        TweenMax.to(element, 1, {opacity:0, width:0});
        $window.setTimeout(done, duration * 1000);
      }
    }
  }])

  .animation('.list-in', ['$window',function($window) {
    return {
      setup: function(element) {
        TweenMax.set(element, {opacity:0, width:0});
      },
      start : function(element, done) {
        var duration = 1; 
        //we can use onComplete:done with TweenMax, but lets use
        //a delay value for testing purposes
        TweenMax.to(element, duration, {opacity:1, width:210});
        $window.setTimeout(done, duration * 1000);
      }
    }
  }])

  .animation('.list-move', ['$window',function($window) {
    return {
      start : function(element, done) {
        var duration = 1; 
        //we can use onComplete:done with TweenMax, but lets use
        //a delay value for testing purposes
        TweenMax.to(element, duration, {opacity:1, width:210});
        $window.setTimeout(done, duration * 1000);
      }
    }
  }])