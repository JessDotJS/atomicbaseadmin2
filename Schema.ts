import {ValueHandler} from './ValueHandler';
import * as firebase from "firebase-admin";



export class Schema {
    private atomicPriority:any;
    private valueHandler: any;

    private dynamic: boolean;

    private primary: any;
    private secondary: any;
    private foreign: any;


    /*
     * Schema initialization
     *
     * @param - Schema Object & atomicPriority
     * */

    constructor(schema: any, atomicPriority: any) {
        if(schema !== undefined && schema !== null) {
            this.atomicPriority = atomicPriority;
            this.valueHandler = new ValueHandler();

            //Build Schema Configuration Objects
            this.dynamic = schema.dynamic || false;
            this.primary = schema.primary || false;
            this.secondary = schema.secondary || false;
            this.foreign = schema.foreign || false;
        }else{
            throw "There was an error initializing the AtomicSchema.";
        }
    }


    /*
     * Build
     *
     * @params
     * data - an Object
     * type - available options: snapshot, primary, secondary & foreign
     * @returns - proper formatted object with desired schema
     * */

    public build(data: any,type: string): any {
            let properties: any;

        if(this.dynamic) {
            data.lastServerTS = firebase.database.ServerValue.TIMESTAMP;
            return data;
        }

        if(type === 'atomicObject'){
            properties  = data.val()
        }else{
            properties  = data
        }

        return this.buildSchemaProperties(this.getPrebuiltData(data, type), properties, type);
    }

    /*
     * Build Schema Properties
     *
     * @params
     * defaults - default object properties
     * data - an object of the Entity
     * type - available options: atomicObject, primary, secondary & foreign
     * @returns - final schema object
     * */

    private buildSchemaProperties(defaults: any, data: any, type: any): any {
        const self = this;
        let dataObject = defaults;
        let selfSchema: any;

        if(type == 'atomicObject'){
            selfSchema = self['primary'];
            type = 'primary';
        }else{
            selfSchema = self[type];
        }
        for (let key in selfSchema) {
            if (!selfSchema.hasOwnProperty(key)) continue;

            dataObject[key] = self.getPropertyValue({
                key: key,
                value: data[key]
            }, data, type);
        }
        return dataObject;

    }

    /*
     * Get Defaults
     *
     * @params
     * data - an afObject coming from snapshot build
     * type - available options: snapshot, primary, secondary & foreign
     * @returns - proper formatted object with desired schema defaults
     * */

    private getPrebuiltData(data: any, type: any): any{
        return this.prebuiltData[type](data, this.atomicPriority.getPriority(data));
    }

    /*
     * Get Property Value
     *
     * @params
     * propertyObject - default object properties
     * propertiesData - an afObject coming from snapshot build
     * type - available options: atomicObject, primary, secondary & foreign
     * @returns - final schema object
     * */

    private getPropertyValue(propertyObject: any, propertiesData: any, type: any): any {

        const self = this;
        let valueHandler = new ValueHandler();
        let dataValue: any;

        if (self[type][propertyObject.key].value == '=') {
            dataValue = valueHandler.getValue(propertyObject.value, propertiesData);
            if(dataValue == undefined || dataValue == null){
                dataValue = valueHandler.getValue(self[type][propertyObject.key].defaultValue, propertiesData);
            }
        }else {
            dataValue = valueHandler.getValue(self[type][propertyObject.key].value, propertiesData);
            if(dataValue == undefined || dataValue == null){
                valueHandler.getValue(self[type][propertyObject.key].defaultValue, propertiesData);
            }
        }
        return dataValue;

    }

    /*
     * prebuiltData.type
     *
     * @params
     * data - an Entity's object
     * defaultPriority - predetermined priority of the item
     * type - available options: atomicObject, primary, secondary & foreign
     * @returns - PreBuilt schema object
     * */

    private prebuiltData = {
        atomicObject: function(data: any, defaultPriority: any): any {
            if(data.exists()) {
                return {
                    $key: data.$key || data.key,
                    creationTS: data.val().creationTS,
                    lastEventTS: data.val().lastEventTS,
                    latestServerTS: data.val().latestServerTS,
                    $priority: data.getPriority() || defaultPriority
                }
            }else {
                return {};
            }
        },
        primary: function(data: any, defaultPriority: any): any{
            if(data !== undefined && data !== null) {
                let currentClientTS = new Date().getTime();
                return {
                    creationTS: data.creationTS || currentClientTS,
                    lastEventTS: currentClientTS,
                    latestServerTS: firebase.database.ServerValue.TIMESTAMP,
                    '.priority': data.$priority  || defaultPriority
                }
            }else{
                return {};
            }

        },
        secondary: function(data: any, defaultPriority: any): any {
            if(data != undefined && data != null) {
                let currentClientTS = new Date().getTime();
                return {
                    creationTS: data.creationTS || currentClientTS,
                    lastEventTS: currentClientTS,
                    latestServerTS: firebase.database.ServerValue.TIMESTAMP,
                    '.priority': data.$priority  || defaultPriority
                }
            }else{
                return {};
            }

        },
        foreign: function(data: any, defaultPriority: any): any {
            if(data != undefined && data != null) {
                let currentClientTS = new Date().getTime();
                return {
                    key: data.$key || data.key,
                    creationTS: data.creationTS || currentClientTS,
                    lastEventTS: currentClientTS,
                    latestServerTS: firebase.database.ServerValue.TIMESTAMP,
                    '.priority': data.$priority  || defaultPriority
                }
            }else{
                return {};
            }
        }
    }



}
