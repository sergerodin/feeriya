// const telegramToken = '892339258:AAEMPavO2G72lQKsuwLcBgX8q1N1dLHUdSc';
// const sergeID = '185981744';
const request = require('request');

module.exports = function(msg) {
	const url = "https://api.telegram.org/bot892339258:AAEMPavO2G72lQKsuwLcBgX8q1N1dLHUdSc/sendMessage?chat_id=185981744&parse_mode=html&text="+msg;
	console.log("TG message: ", msg);
	return request(url, function(error, response){
		if (error) {return console.log('TG: an error establishing telegram api connection')}
	});
}
