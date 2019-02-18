var crypto = require('crypto');
var config = require('./config.js');

var helpers = {};

helpers.hash = function(password) {
    if(typeof(password) === 'string' && password.length > 0){
         var hash = crypto.createHmac('sha256',config.hashingSecret).update(password).digest('hex');
         return hash;
    } else {
        return false;
    }
}

helpers.parseJsonToObject = function(str) {
    try{
        return JSON.parse(str);
    } catch(e){
        return {};
    }
}

helpers.createRandomString = function (stringLength) {
    stringLength = typeof(stringLength) === 'number' ? stringLength : false;
    if(stringLength){
        var possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var finalString = '';
        for( i = 0; i<stringLength; i++){
            var randChar = possibleChars.charAt(Math.floor(Math.random()*possibleChars.length));
            finalString += randChar;
        }
        return finalString;
    } else {
        return false;
    }
}
module.exports = helpers;