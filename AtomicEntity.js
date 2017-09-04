"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RefRegistrator_1 = require("./RefRegistrator");
var Schema_1 = require("./Schema");
var AtomicPriority_1 = require("./AtomicPriority");
var Query_1 = require("./Query");
var Server_1 = require("./Server");
var AtomicArray_1 = require("./AtomicArray");
var AtomicObject_1 = require("./AtomicObject");
var AtomicEntity = (function () {
    function AtomicEntity(dbObject) {
        this.ref = new RefRegistrator_1.RefRegistrator(dbObject.refs);
        this.atomicPriority = new AtomicPriority_1.AtomicPriority(dbObject.schema.priority || null, this.ref);
        this.schema = new Schema_1.Schema(dbObject.schema, this.atomicPriority);
        this.query = new Query_1.Query(this.ref, this.schema);
        this.server = new Server_1.Server(this.ref);
    }
    AtomicEntity.prototype.getArrayInstance = function () {
        return new AtomicArray_1.AtomicArray(this);
    };
    AtomicEntity.prototype.getObjectInstance = function () {
        return new AtomicObject_1.AtomicObject(this);
    };
    AtomicEntity.prototype.create = function (record) {
        return this
            .query
            .create(record);
    };
    AtomicEntity.prototype.createWithCustomKey = function (record, customKey) {
        return this
            .query
            .createWithCustomKey(record, customKey);
    };
    AtomicEntity.prototype.update = function (record) {
        return this
            .query
            .update(record);
    };
    AtomicEntity.prototype.remove = function (record) {
        return this
            .query
            .remove(record);
    };
    return AtomicEntity;
}());
exports.AtomicEntity = AtomicEntity;
