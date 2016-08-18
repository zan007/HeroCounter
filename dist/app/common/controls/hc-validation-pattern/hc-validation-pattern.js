angular.module('controls.hcValidationPattern', [])

.constant('validationPatterns', {
	TEXT: /^[a-zA-Z0-9]+$/,//TEXT: /^[^\x22\x27\x26\x3C\x3E\x24\x60\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u201A\u201E-]*$/,
	EMAIL: /^([^.@]+)(\.[^.@]+)*@([^.@]+\.)+[^.@]{2,6}$/,
	NUMBER: /^[0-9]*$/,
	EMAIL_CHARS: /^[a-zA-Z0-9_\-\.\@]+$/
})

.directive('hcValidationPattern', ['validationPatterns', function(validationPatterns) {
	var patternCache = {},
		getRegExp = function(patternKey) {
			var regExp = patternCache[patternKey];
			if (!regExp) {
				var pattern = validationPatterns[patternKey];
				if (!pattern)
					return null;

				regExp = patternCache[patternKey] = new RegExp(pattern);
			}
			return regExp;
		};

	return {
		require: 'ngModel',
		link: function($scope, iElm, iAttrs, ctrl) {
			var patternRegExps;

			iAttrs.$observe('hcValidationPattern', function(value) {
				for(var i = 0; patternRegExps && i < patternRegExps.length; i++) {
					ctrl.$setValidity('hcValidationPattern.'+patternRegExps[i].patternKey, true);
				}

				if (value) {
					patternRegExps = value.split(',').map(function(patternKey) {
						return {
							patternKey: patternKey,
							validator: getRegExp(patternKey)
						};
					});
					ctrl.$validate();
				} else {
					patternRegExps = null;
				}
			});

			ctrl.$validators.hcValidationPattern = function(value) {
				if (!patternRegExps)
					return true;
				
				var patternResult = true;
				for(var i = 0; i < patternRegExps.length; i++) {
					var result = patternRegExps[i].validator.test(value);
					ctrl.$setValidity('hcValidationPattern.'+patternRegExps[i].patternKey, result);
					patternResult = patternResult && result;
				}
				return patternResult;
			};
		}
	};
}]);
