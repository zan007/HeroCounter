var fs = require('fs'),
	ipsum = require('lorem-ipsum'),
	path = require('path');


exports.generateData = function(accountsCount, transactionsCount, monthsBack, next) {
	
	/*console.log('Generated ' + accountsCount + ' accounts, ' + transactionsCount + ' transactions within the last ' + monthsBack + ' months!');
	var transactions = [],
		categories = JSON.parse(fs.readFileSync('data/categories.json')),
		childCategories = getChildCategories(categories);
		

	generateAccounts(accountsCount);

	accounts[0].default = true;
	if (accounts.length > 2)
		accounts[0].accountType = 'G';

	for(var i = 1; i <= transactionsCount; i++) {
		var category = childCategories[randInt(0, childCategories.length - 1)],
			amount = randInt(0, 10) > 2 ? randAmount(-300, 300) : randAmount(-4000, 4000),
			accountId = randInt(1, accountsCount),
			currency = getTransactionCurrency(accounts, accountId),
			tags = randTags();
		transactions.push({
			id: i,
			accountId: accountId,
			categoryId: category.id,
			date: randTimestamp(monthsBack),
			title: ipsum({count: 1, units: 'sentences', sentenceLowerBound: 3, sentenceUpperBound: 4 }),
			currency: currency,
			amount: amount,
			tags: tags,
			amountInPln: countInPln(amount, currency)
		});
	}
	
	transactions.sort(function(t1, t2) {
		return t2.date - t1.date;
	});

	var data = {banks: banks, categories: categories, accounts: accounts, transactions: transactions};
*/
var data = {skills: ''};
	fs.writeFile('data/data.json', JSON.stringify(data, null, 4), function(err) {
		if (err)
			return next(err, null);
		console.log('Data written to data.json');
		next(null, data);
	});

	return data;
}

