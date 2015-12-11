angular.module('creaturesQueryFilter',[])

.constant('localLetters', {
    'ą': 'a',
    'ć': 'c',
    'ę': 'e',
    'ł': 'l',
    'ń': 'n',
    'ó': 'o',
    'ś': 's',
    'ź': 'z',
})

.filter('creaturesQueryFilter', function(localLetters){

    var localLettersChain = 'ą|ć|ę|ł|ń|ó|ś|ź';
	return function(input, query){
		if (!input || !query)
            return input;

		var output = [];
        var queryWithoutLocal = query.replace(new RegExp(localLettersChain,'gi'), function(matched){
          return localLetters[matched];
        });

        for(var i = 0; i < input.length; i++){
            currentItem = input[i];

            if(currentItem.name.toLowerCase().indexOf(query) != -1 || currentItem.name.toLowerCase().indexOf(queryWithoutLocal) != -1 || currentItem.name.indexOf(query) != -1 || currentItem.name.indexOf(queryWithoutLocal) != -1) {
        	   output.push(input[i]);
            }
        }

        return output;
	};
});
