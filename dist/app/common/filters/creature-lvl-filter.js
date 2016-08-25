angular.module('creatureLvlFilter',[])

.filter('creatureLvlFilter',function(){
	return function(input, lvlRange){
		if (!input)
            return input;

		var output = [];

        var from = lvlRange.minValue;
        var to = lvlRange.maxValue;

        for(var i = 0; i < input.length; i++){
            currentItem = input[i];
            if(currentItem.lvl >= from && currentItem.lvl <= to) {
        	   output.push(input[i]);
            }
        }

        return output;
	};
});
