
const jsesc = require('jsesc');

const matchQuote = new RegExp('"', "g");
const matchNewLine = new RegExp('\n', "g");
const matchCR = new RegExp('\r', "g");
const matchSlash = new RegExp('\\$');

function sanitizeString(str) {
    return jsesc(str, { 'quotes': 'double' });
}

function getDateTime() {
    var date = new Date();

    var millisec = date.getMilliseconds();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec + ":" + millisec;

}

function makeMessage(type, obj) {
    let str = "[" + type;

    for (var prop in obj) {
        if (typeof obj[prop] === 'string' || obj[prop] instanceof String) {
            str += ', ' + prop + ': "' + sanitizeString("" + obj[prop]) + '"';
        }
        else if (obj[prop] instanceof Array) {
            str += ', ' + prop + ': [' + obj[prop] + ']';
        }
        else {
            str += ", " + prop + ": " + obj[prop];
        }
    }

    return str + "]";
}

function log(type, obj) {
    obj.time = getDateTime();
    console.log(makeMessage(type, obj)); 
}

module.exports = {
    debug_info: false,
    active_info: true,
    log: log,
    debug: function (type, obj) {
        if (module.exports.debug_info) {
            log(type, obj);
        }
    },
    optional: function (type, obj) {
        if (module.exports.active_info) {
            log(type, obj);
        }
    }
};
