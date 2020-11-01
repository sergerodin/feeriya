/* https://github.com/55sketch/gsx2json/blob/master/api.js */
var request = require('request');
const tg = require("./tg-notifier");

module.exports = function(id, sheet, cb, dataObj, callback) {
    const url = 'https://spreadsheets.google.com/feeds/list/' + id + '/' + sheet + '/public/values?alt=json';
    return request(url, function(error, response, body) {
        var query = '',
            useIntegers = true,
            showRows = true,
            showColumns = false;
        if (!error && response.statusCode === 200) {
            var data = JSON.parse(response.body);
            var responseObj = dataObj || {};
            var rows = [];
            var columns = {};
            var title = data.feed.title.$t;
            if (!data.feed.entry) {responseObj[title] = []; return cb(responseObj)}
            for (var i = 0; i < data.feed.entry.length; i++) {
                var entry = data.feed.entry[i];
                var keys = Object.keys(entry);
                var newRow = {};
                var queried = false;
                for (var j = 0; j < keys.length; j++) {
                    var gsxCheck = keys[j].indexOf('gsx$');
                    if (gsxCheck > -1) {
                        var key = keys[j];
                        var name = key.substring(4);
                        var content = entry[key];
                        var value = content.$t;
                        if (value.toLowerCase().indexOf(query.toLowerCase()) > -1) {
                            queried = true;
                        }
                        if (useIntegers === true && !isNaN(value)) {
                            value = Number(value);
                        }
                        newRow[name] = value;
                        if (queried === true) {
                            if (!columns.hasOwnProperty(name)) {
                                columns[name] = [];
                                columns[name].push(value);
                            } else {
                                columns[name].push(value);
                            }
                        }
                    }
                }
                if (queried === true) {
                    rows.push(newRow);
                }
            }
            if (showColumns === true) {
                responseObj['columns'] = columns;
            }
            if (showRows === true) {
                rows.splice(0, 1); // Removing the Gspreadshits decoration element (fiels headers)
                responseObj[title] = rows;
            }
            return cb(responseObj, callback);
        } else {
            tg('Getting Gspreadshits went wrong. Error message: ', JSON.stringify(error))
            return error;
        }
    })
}