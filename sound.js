var rp = require('request-promise');
var secrets = require('./secrets');

var api = 'http://freesound.org/apiv2/';

module.exports = function(query){
	return rp({
		uri: api + 'search/text/',
		qs: {
			token: secrets.freesoundKey,
			query: query,
      filter: 'duration:[* TO 5]'
		},
		json: true
	})
		.then(function(res){
      var firstResult = res.results[0];

      if(firstResult){
        return rp({
          uri: api + 'sounds/' + firstResult.id,
          qs: {
            token: secrets.freesoundKey,
          },
          json: true
        })
      } else {
        throw Error('No results')
      }
		})
}


