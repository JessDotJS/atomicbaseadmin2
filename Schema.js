"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueHandler_1 = require("./ValueHandler");
var firebase = require("firebase-admin");
var Schema = (function () {
    function Schema(schema, atomicPriority) {
        this.prebuiltData = {
            atomicObject: function (data, defaultPriority) {
                if (data.exists()) {
                    return {
                        $key: data.$key || data.key,
                        creationTS: data.val().creationTS,
                        lastEventTS: data.val().lastEventTS,
                        latestServerTS: data.val().latestServerTS,
                        $priority: data.getPriority() || defaultPriority
                    };
                }
                else {
                    return {};
                }
            },
            primary: function (data, defaultPriority) {
                if (data !== undefined && data !== null) {
                    var currentClientTS = new Date().getTime();
                    return {
                        creationTS: data.creationTS || currentClientTS,
                        lastEventTS: currentClientTS,
                        latestServerTS: firebase.database.ServerValue.TIMESTAMP,
                        '.priority': data.$priority || defaultPriority
                    };
                }
                else {
                    return {};
                }
            },
            secondary: function (data, defaultPriority) {
                if (data != undefined && data != null) {
                    var currentClientTS = new Date().getTime();
                    return {
                        creationTS: data.creationTS || currentClientTS,
                        lastEventTS: currentClientTS,
                        latestServerTS: firebase.database.ServerValue.TIMESTAMP,
                        '.priority': data.$priority || defaultPriority
                    };
                }
                else {
                    return {};
                }
            },
            foreign: function (data, defaultPriority) {
                if (data != undefined && data != null) {
                    var currentClientTS = new Date().getTime();
                    return {
                        key: data.$key || data.key,
                        creationTS: data.creationTS || currentClientTS,
                        lastEventTS: currentClientTS,
                        latestServerTS: firebase.database.ServerValue.TIMESTAMP,
                        '.priority': data.$priority || defaultPriority
                    };
                }
                else {
                    return {};
                }
            }
        };
        if (schema !== undefined && schema !== null) {
            this.atomicPriority = atomicPriority;
            this.valueHandler = new ValueHandler_1.ValueHandler();
            this.dynamic = schema.dynamic || false;
            this.primary = schema.primary || false;
            this.secondary = schema.secondary || false;
            this.foreign = schema.foreign || false;
        }
        else {
            throw "There was an error initializing the AtomicSchema.";
        }
    }
    Schema.prototype.build = function (data, type) {
        var properties;
        if (this.dynamic) {
            data.lastServerTS = firebase.database.ServerValue.TIMESTAMP;
            return data;
        }
        if (type === 'atomicObject') {
            properties = data.val();
        }
        else {
            properties = data;
        }
        return this.buildSchemaProperties(this.getPrebuiltData(data, type), properties, type);
    };
    Schema.prototype.buildSchemaProperties = function (defaults, data, type) {
        var self = this;
        var dataObject = defaults;
        var selfSchema;
        if (type == 'atomicObject') {
            selfSchema = self['primary'];
            type = 'primary';
        }
        else {
            selfSchema = self[type];
        }
        for (var key in selfSchema) {
            if (!selfSchema.hasOwnProperty(key))
                continue;
            dataObject[key] = self.getPropertyValue({
                key: key,
                value: data[key]
            }, data, type);
        }
        return dataObject;
    };
    Schema.prototype.getPrebuiltData = function (data, type) {
        return this.prebuiltData[type](data, this.atomicPriority.getPriority(data));
    };
    Schema.prototype.getPropertyValue = function (propertyObject, propertiesData, type) {
        var self = this;
        var valueHandler = new ValueHandler_1.ValueHandler();
        var dataValue;
        if (self[type][propertyObject.key].value == '=') {
            dataValue = valueHandler.getValue(propertyObject.value, propertiesData);
            if (dataValue == undefined || dataValue == null) {
                dataValue = valueHandler.getValue(self[type][propertyObject.key].defaultValue, propertiesData);
            }
        }
        else {
            dataValue = valueHandler.getValue(self[type][propertyObject.key].value, propertiesData);
            if (dataValue == undefined || dataValue == null) {
                valueHandler.getValue(self[type][propertyObject.key].defaultValue, propertiesData);
            }
        }
        return dataValue;
    };
    return Schema;
}());
exports.Schema = Schema;
