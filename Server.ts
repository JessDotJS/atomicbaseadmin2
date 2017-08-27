/**
 * Created by jessdotjs on 23/06/17.
 */
import * as firebase from "firebase-admin";



export class Server {
    private ref: any;

    constructor(ref: any) {
        this.ref = ref.root.child('atomicBase/server');
    }


    private update(): Promise<any> {
        const self = this;
        return new Promise(function(resolve, reject){
            self.ref.set({TS: firebase.database.ServerValue.TIMESTAMP})
                .then(function(response){
                    resolve(response);
                }).catch(function(err){reject(err)});
        });
    }


    private get(): Promise<any> {
        const self = this;
        return new Promise(function(resolve, reject){
            self.ref.once('value')
                .then(function(snapshot){
                    resolve(snapshot.val().TS);
                }).catch(function(err){reject(err)});
        });
    }

    public serverTimestamp(): Promise<any> {
        const self = this;
        return new Promise(function(resolve, reject){
            self.update().then(function(){
                self.get().then(function(timestamp){
                    resolve(timestamp);
                }).catch(function(err){reject(err)});
            }).catch(function(err){reject(err)});
        });

    }
}
