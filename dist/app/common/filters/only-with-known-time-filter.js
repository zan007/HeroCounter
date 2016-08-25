angular.module('onlyWithKnownTimeFilter',[])

.filter('onlyWithKnownTimeFilter', function(){
	return function(input, onlyWithKnownTime){
		if (!input)
            return input;

		var output = [];

        for(var i = 0; i < input.length; i++){
            currentItem = input[i];
            if(onlyWithKnownTime ) {
                if(currentItem.timeToResp) {
            	   output.push(input[i]);
                }
            } else {
                output.push(input[i]);
            }
        }

        return output;
	};
});
