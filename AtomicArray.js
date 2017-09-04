"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var querybase_1 = require("querybase");
var BehaviorSubject_1 = require("rxjs/BehaviorSubject");
var AtomicArray = (function () {
    function AtomicArray(atomicModule) {
        this.schema = atomicModule.schema;
        this.server = atomicModule.server;
        this.atomicPriority = atomicModule.atomicPriority;
        this.subscribed = false;
        this.items = [];
        this.list = new BehaviorSubject_1.BehaviorSubject(this.items);
    }
    AtomicArray.prototype.on = function (ref, config) {
        var self = this;
        this.initialLotLoaded = false;
        this.itemsRemaining = false;
        this.fetching = false;
        if (config === undefined) {
            this.firstLotSize = 99999;
            this.nextLotSize = 99999;
        }
        else {
            this.firstLotSize = config.firstLotSize || 99999;
            this.nextLotSize = config.nextLotSize || 99999;
        }
        if (config !== undefined && config.where !== undefined && config.where !== null) {
            this.ref = new querybase_1.Querybase(ref, []);
            return this.loadQuery(config.where);
        }
        else {
            this.ref = ref;
            return this.loadFirstLot(config);
        }
    };
    AtomicArray.prototype.off = function () {
        this.unsubscribe();
        this.initialLotLoaded = false;
        this.itemsRemaining = false;
        this.fetching = false;
        this.items = [];
    };
    AtomicArray.prototype.loadQuery = function (where) {
        this.fetching = true;
        var self = this;
        return new Promise(function (resolve, reject) {
            var key;
            for (key in where) {
                if (!where.hasOwnProperty(key))
                    continue;
                if (typeof where[key] === 'object') {
                    var subKey = void 0;
                    for (subKey in where[key]) {
                        self.eventListenerRef =
                            self.ref.where(key)[subKey](where[key][subKey]);
                        resolve(true);
                    }
                }
                else {
                    self.eventListenerRef = self.ref.where(where[key]);
                    resolve(true);
                }
            }
            self.eventListenerRef.on('value', function (snapshot) {
                self.fetching = false;
                self.initialLotLoaded = true;
                self.subscribe();
                resolve(true);
            });
        });
    };
    AtomicArray.prototype.loadFirstLot = function (config) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.fetching = true;
            self.ref
                .limitToFirst(self.firstLotSize)
                .once('value', function (snapshot) {
                self.server.serverTimestamp()
                    .then(function (serverTS) {
                    self.eventListenerRef =
                        self.ref
                            .orderByChild('latestServerTS')
                            .startAt(serverTS);
                    self.initialLotLoaded = true;
                    self.subscribe();
                    self.processSnapshot(snapshot);
                    self.fetching = false;
                    resolve(true);
                })
                    .catch(function (err) { reject(err); console.log(err); });
            }, function (err) {
                reject(err);
                console.log(err);
            });
        });
    };
    AtomicArray.prototype.loadNext = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (!self.fetching && self.items[self.items.length - 1] != undefined) {
                self.fetching = true;
                var nextLotRef = self.ref
                    .startAt(self.items[self.items.length - 1].$priority + 1)
                    .limitToFirst(self.nextLotSize);
                nextLotRef.once('value').then(function (snapshot) {
                    self.processSnapshot(snapshot);
                    setTimeout(function () {
                        self.fetching = false;
                        resolve(true);
                    }, 3000);
                }).catch(function (err) {
                    reject(err);
                });
            }
            else {
                resolve(false);
            }
        });
    };
    AtomicArray.prototype.subscribe = function () {
        var self = this;
        self.subscribed = true;
        self.eventListenerRef.on('child_added', function (snapshot) {
            self.addItem(snapshot, true);
        });
        self.eventListenerRef.on('child_changed', function (snapshot) {
            self.editItem(snapshot);
        });
        self.eventListenerRef.on('child_moved', function (snapshot) {
            self.editItem(snapshot);
        });
        self.eventListenerRef.on('child_removed', function (snapshot) {
            self.removeItem(snapshot);
        });
    };
    AtomicArray.prototype.unsubscribe = function () {
        var self = this;
        if (self.subscribed) {
            self.eventListenerRef.off('child_added');
            self.eventListenerRef.off('child_changed');
            self.eventListenerRef.off('child_moved');
            self.eventListenerRef.off('child_removed');
            self.subscribed = false;
        }
    };
    AtomicArray.prototype.processSnapshot = function (snapshot) {
        var self = this;
        snapshot.forEach(function (item) {
            self.addItem(item, false);
        });
    };
    AtomicArray.prototype.addItem = function (snapshot, isNew) {
        if (!this.itemExists(snapshot)) {
            var atomicObject = this.schema.build(snapshot, 'atomicObject');
            if (isNew)
                atomicObject._isNew = true;
            this.items.push(atomicObject);
            this.sortArray();
            this.list.next(this.items.slice());
        }
    };
    AtomicArray.prototype.editItem = function (snapshot) {
        var atomicObject = this.schema.build(snapshot, 'atomicObject');
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].$key == atomicObject.$key) {
                this.items[i] = atomicObject;
                this.sortArray();
            }
        }
        this.list.next(this.items.slice());
    };
    AtomicArray.prototype.removeItem = function (snapshot) {
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].$key == snapshot.key) {
                this.items.splice(i, 1);
                this.sortArray();
            }
        }
        this.list.next(this.items.slice());
    };
    AtomicArray.prototype.itemExists = function (snapshot) {
        var exists = false;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].$key == snapshot.key) {
                exists = true;
            }
        }
        return exists;
    };
    AtomicArray.prototype.sortArray = function () {
        this.items.sort(this.sortByPriority);
    };
    AtomicArray.prototype.sortByPriority = function (a, b) {
        return a.$priority - b.$priority;
    };
    return AtomicArray;
}());
exports.AtomicArray = AtomicArray;
