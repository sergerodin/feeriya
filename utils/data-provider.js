const gspreadshits = require("./gspreadshits-response");
const fs = require("fs");
const tg = require("./tg-notifier");
const slugify = require('transliteration').slugify;



/* Returns new array that has all the requiredVal fields and they are not false or empty.
Both arguments should be arrays */
function removeBadEntries (obj, requiredVal) {
	let i, val, resObj = [];

	function hasValues(entry){
		let res = true;
		requiredVal.forEach(function(val) {
			if (!entry[val] || entry[val].toString().trim() == '0' || entry[val].toString().trim() == '') res = false;
			if (val == 'show' && entry[val] && entry[val] == 'нет') res = false;
		})
		return res;
	}

	obj.forEach(function(item, ind){
		if (hasValues(item)) resObj.push(item)
	})

	return resObj;
}

// const transSnippet = 'c_lpad,h_900,q_auto:eco'; // Add this to the url for Cloudinary dinamic transformation
// const transSnippet = 'w_700,ar_1,c_crop,g_auto'; // Add this to the url for Cloudinary dinamic transformation
const transSnippet = 'w_700'; // Add this to the url for Cloudinary dinamic transformation
function cloudImgTransform(img){
	let i = img.split('/');
	i.forEach(function(item,ind){if (item == "upload") {i.splice(ind+1,0,transSnippet)}})
	return i.join('/');
}

function dataTransform (data) {
	for (var key in data) {
	  if (key == 'Товары') {
	  	data[key] = removeBadEntries(data[key], ["title", "section", "show"]);
	  	data[key].forEach(function(item){
    		item.item_slug = slugify(item.title);
    		item.section_slug = slugify(item.section);
    		if (item.img && item.img.length > 0) {item.img = cloudImgTransform(item.img)}
	  	})

	  } else if (key == 'Разделы') {
	  	data[key] = removeBadEntries(data[key], ["title", "img", "show"])
	  	data[key].forEach(function(item){
    		item.slug = slugify(item.title);
	  	})
	  } else if (key == 'Общее') {
	  
	  }
	}
  	return data;
}



const spreadShitID = '1O2fR-ey8aagQRuCVwfTzMnM2vmmhpWthmq7379zyZMg';
const sheetsLength = 3; // Number of sheets
let sheetsIndex = 1;

function gspreadshitsCb (data, callback) {
	if (sheetsIndex < sheetsLength) {
		return gspreadshits(spreadShitID, ++sheetsIndex, gspreadshitsCb, data, callback);
	} else {
		data = dataTransform(data);
		if (!data) return tg("Something went wrong, can't provide the data.")
		let filepath = 'src/site-data/data.json'
	  	fs.writeFile(filepath, JSON.stringify(data), (err) => {
	    	if (err) throw err;
			console.log("The file was succesfully saved!");
		});
		return callback(data);
	}
}

function provideData(callback) {
  if (!callback) return false;
  return gspreadshits(spreadShitID, sheetsIndex, gspreadshitsCb, {}, callback);
};


module.exports = provideData;
