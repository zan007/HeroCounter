angular.module('respTimeFilter',[])

.filter('respTimeFilter',function(){
	return function(input, hoursToResp){
		if (!input)
            return input;

		var output = [];
		var hoursToRespTimestamp = hoursToResp * 3600000;
		for(var i = 0; i < input.length; i++){
			var currentItem = input[i];

			if(currentItem.timeToResp && (hoursToRespTimestamp > currentItem.timeToResp)) {
				output.push(input[i]);
			}

		}
        return output;
	};
});
