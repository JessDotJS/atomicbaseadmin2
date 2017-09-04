import * as firebase from "firebase-admin";

export class RefRegistrator {
	public root: any;
    public primary: any;
    public secondary: any;
    public foreign: any;

	constructor(refsObject:any){

	    if(firebase !== undefined && firebase !== null){
	        /*
	        * Database Related
	        * */
	        this.root = refsObject.root || firebase.database().ref();
	        this.primary = refsObject.primary;
	        this.secondary = refsObject.secondary || false;
	        this.foreign = refsObject.foreign || false;


	    }else{
	        throw "Firebase has not been initialized, make sure you initialize it at the end of your index.html (firebase.initializeApp(config);)";
	    }

	}

	public getSecondaryRefs(atomicObject: any): Promise<any> {
		const self = this;
		return new Promise(function(resolve,reject) {
	        self.secondary(atomicObject)
	        	.then(function(secondaryRefs) {
	            	resolve(secondaryRefs);
	        	}).catch(function(err) { reject(err); });
		})
	}

	public getForeignRefs(atomicObject: any): Promise<any> {
		const self = this;
	    return new Promise(function(resolve, reject) {
	        self.foreign(atomicObject)
	        	.then(function(foreignRefs) {
	            	resolve(foreignRefs);
	        	})
	        	.catch(function(err) { reject(err); });
	    });
	}



}