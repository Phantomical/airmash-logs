
import jsesc from 'jsesc';

function sanitizeString(str: string): string {
    return jsesc(str, { quotes: 'double', minimal: true });
}

function getDateTime(): string {
    var date = new Date();

    var millisec = date.getMilliseconds();

    var hour: number | string = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min: number | string = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec: number | string = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year: number | string = date.getFullYear();

    var month: number | string = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day: number | string = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec + ":" + millisec;
}
function makeMessage(type: string, obj: any) {
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

export class Logger {
    static debug_info: boolean = false;
    static active_info: boolean = true;

    static log(type: string, obj: any) {
        obj.time = getDateTime();
        console.log(makeMessage(type, obj));
    }

    static debug (type: string, obj: any) {
        if (Logger.debug_info) {
            Logger.log(type, obj);
        }
    }

    static optional(type: string, obj: any) {
        if (Logger.active_info) {
            Logger.log(type, obj);
        }
    }
}