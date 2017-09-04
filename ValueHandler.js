"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueHandler = (function () {
    function ValueHandler() {
        this.defaultVal = null;
    }
    ValueHandler.prototype.getValue = function (value, data) {
        var self = this;
        var valueType = typeof value;
        if (value != undefined) {
            if (valueType == 'string' || valueType == 'number' || valueType == 'object' || valueType == 'boolean') {
                return self.handleNormal(value, data);
            }
            else if (valueType == 'function') {
                return self.handleFunction(value, data);
            }
        }
        else {
            return self.defaultVal;
        }
    };
    ValueHandler.prototype.handleNormal = function (value, data) {
        var self = this;
        if (value == undefined) {
            value = self.defaultVal;
        }
        return value;
    };
    ValueHandler.prototype.handleFunction = function (value, data) {
        var self = this;
        if (value(data) == undefined) {
            value = self.defaultVal;
        }
        return value(data);
    };
    return ValueHandler;
}());
exports.ValueHandler = ValueHandler;
