export class Query {
    private ref: any;
    private schema: any;

    constructor(ref: any, schema: any) {
        this.ref = ref;
        this.schema = schema;
    }


    /*
    * CRUD Related Methods
    *
    * create
    * update
    * remove
    * alter
    * processFanoutObject
    * */
    public create(atomicObject: any): Promise<any> {
        const self = this;
        let fanoutObject = {};
        let primaryRef = self.ref.root.child(self.ref.primary);

        return new Promise(function(resolve, reject) {
            const objectBuild = self.schema.build(atomicObject, 'primary');
            primaryRef.push(objectBuild)
                .then(function(snapshot) {
                    atomicObject.$key = snapshot.key;
                    if(self.ref.secondary){
                        self.ref.getSecondaryRefs(atomicObject).then(function(secondaryRefs) {
                            for(let i = 0; i < secondaryRefs.length; i++) {
                                fanoutObject[secondaryRefs[i]] =
                                    self.schema.build(atomicObject, 'secondary')
                            }
                            self.processFanoutObject(fanoutObject).then(function(response) {
                                resolve(atomicObject.$key);
                            }).catch(function(err){reject(err)});
                        }).catch(function(err){reject(err)});
                    }else{
                        resolve(atomicObject.$key);
                    }
                }).catch(function(err){reject(err)});
        });
    }

    public createWithCustomKey(atomicObject: any, customKey: string): Promise<any> {
        const self = this;
        let fanoutObject = {};
        let primaryRef = self.ref.root.child(self.ref.primary);

        return new Promise(function(resolve, reject) {
            const objectBuild = self.schema.build(atomicObject, 'primary');
            primaryRef.child('/' + customKey).set(objectBuild)
                .then(function(snapshot) {
                    atomicObject.$key = customKey;
                    if(self.ref.secondary){
                        self.ref.getSecondaryRefs(atomicObject).then(function(secondaryRefs) {
                            for(let i = 0; i < secondaryRefs.length; i++) {
                                fanoutObject[secondaryRefs[i]] =
                                    self.schema.build(atomicObject, 'secondary')
                            }
                            self.processFanoutObject(fanoutObject).then(function(response) {
                                resolve(atomicObject.$key);
                            }).catch(function(err){reject(err)});
                        }).catch(function(err){reject(err)});
                    }else{
                        resolve(atomicObject.$key);
                    }
                }).catch(function(err){reject(err)});
        });
    }

    public update(atomicObject: any): Promise<any> {
        const self = this;
        return new Promise(function(resolve, reject) {
            self.alter(atomicObject, 'update')
                .then(function(response) {
                resolve(true);
            }).catch(function(err){ reject(err); });
        });
    }

    public remove(atomicObject: any): Promise<any> {
        const self = this;
        return new Promise(function(resolve, reject) {
            self.alter(atomicObject, 'update').then(function(response){
                self.alter(atomicObject, 'remove').then(function(response){
                    resolve(response);
                }).catch(function(err){reject(err)});
            }).catch(function(err){reject(err)});
        });
    }

    private alter(atomicObject: any, type: any): Promise<any> {
        const self = this;
        let fanoutObject = {};

        let primary;
        let secondary;
        let foreign;

        if(type == 'update'){
            primary = self.schema.build(atomicObject, 'primary');
            secondary = self.schema.build(atomicObject, 'secondary');
            foreign = self.schema.build(atomicObject, 'foreign');
        }else if(type == 'remove'){
            primary = {};
            secondary = {};
            foreign = {};
        }


        return new Promise(function(resolve, reject){
            let objectKey;
            if(atomicObject.$key == undefined){
                objectKey = atomicObject.key;
            }else{
                objectKey = atomicObject.$key;
            }


            /*
             * Primary Ref
             * */

            fanoutObject[self.ref.primary + '/' + objectKey] = primary;

            /*
             * Secondary & Foreign
             * */
            if(self.ref.secondary && self.ref.foreign) {
                self.ref.secondary(atomicObject).then(function(secondaryRefs) {
                    self.ref.foreign(atomicObject).then(function(foreignRefs) {
                        for(let i = 0; i <secondaryRefs.length; i++){
                            fanoutObject[secondaryRefs[i]] = secondary;
                        }
                        for(let i = 0; i < foreignRefs.length; i++){
                            fanoutObject[foreignRefs[i]] = foreign;
                        }
                        self.processFanoutObject(fanoutObject).then(function(response) {
                            resolve(response);
                        }).catch(function(err){reject(err)});
                    }).catch(function(err){reject(err)});
                }).catch(function(err){reject(err)});
            }
            /*
             * Secondary & !Foreign
             * */
            else if(self.ref.secondary && !self.ref.foreign){
                self.ref.secondary(atomicObject).then(function(secondaryRefs) {
                    for(let i = 0; i <secondaryRefs.length; i++) {
                        fanoutObject[secondaryRefs[i]] = secondary;
                    }
                    self.processFanoutObject(fanoutObject).then(function(response) {
                        resolve(response);
                    }).catch(function(err){reject(err)});
                }).catch(function(err){reject(err)});
            }

            /*
             * !Secondary & Foreign
             * */
            else if(!self.ref.secondary && self.ref.foreign){
                self.ref.foreign(atomicObject).then(function(foreignRefs) {
                    for(let i = 0; i < foreignRefs.length; i++){
                        fanoutObject[foreignRefs[i]] = foreign;
                    }
                    self.processFanoutObject(fanoutObject).then(function(response) {
                        resolve(response);
                    }).catch(function(err){reject(err)});
                }).catch(function(err){reject(err)});
            }

            /*
             * !Secondary & !Foreign
             * */
            else{
                self.processFanoutObject(fanoutObject).then(function(response) {
                    resolve(response);
                }).catch(function(err){reject(err)});
            }
        });

    }


    private processFanoutObject(fanoutObject: any): Promise<any> {
        const self = this;
        return new Promise(function(resolve, reject) {
            self.ref.root.update(fanoutObject)
                .then(function(response) {
                resolve(response);
            }).catch(function(err){reject(err)});
        });
    }
}


