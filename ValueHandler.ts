/*
 * Value Handler
 * */
 export class ValueHandler {
	 defaultVal: any;
 	constructor(){
 		this.defaultVal = null;
 	}
 	getValue(value:any, data:any):any{
	    const self = this;
	    let valueType = typeof value;
	    if(value != undefined){
	        if(valueType == 'string' || valueType == 'number' || valueType == 'object' || valueType == 'boolean'){
	            return self.handleNormal(value, data);
	        }else if(valueType == 'function'){
	            return self.handleFunction(value, data);
	        }
	    }else{
	        return self.defaultVal
	    }
 	}

	/*
	 * Value Handlers
	 * */
 	
 	handleNormal(value: any, data: any): any{
 		const self = this;
	    if (value == undefined) {
	        value = self.defaultVal;
	    }
	    return value;
 	}
 	handleFunction(value: any, data: any): any{
		const self = this;
	     if(value(data) == undefined){
	        value = self.defaultVal;
	    }
	    return value(data);
 	}

}