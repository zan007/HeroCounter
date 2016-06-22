angular.module('creatureTypeFilter',[])

.filter('creatureTypeFilter',function(){
	return function(input, type){
		if (!input)
            return input;

		var output = [];

        for(var i = 0; i < input.length; i++){
            currentItem = input[i];
            if((currentItem.type === 'titan' || currentItem.type === 'event-titan') && type.titan) {
        	   output.push(input[i]);
            } 
            if((currentItem.type === 'hero' || currentItem.type === 'event-hero') && type.hero) {
                output.push(input[i]);
            }
        }

        return output;
	};
});
