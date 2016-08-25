angular.module('respTimeFilter',[])

.filter('respTimeFilter',function(){
	return function(input, hoursToResp){
		if (!input)
            return input;

		var output = [];

 /*       for(var i = 0; i < input.length; i++){
            currentItem = input[i];
            if(currentItem.type === type) {
        	   output.push(input[i]);
            }
        }
*/
        return input;
	};
});
