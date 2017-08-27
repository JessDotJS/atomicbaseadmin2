/**
 * Created by jessdotjs on 23/06/17.
 */

import {BehaviorSubject} from 'rxjs/BehaviorSubject';


export class AtomicObject {
    // Ref to be retrieved & Listened to
    private ref: any;
    private eventListenerRef: any;

    // AtomicObject's Dependencies
    private schema: any;

    // AtomicObject's Observable
    public item: any;


    public loaded: boolean;




    constructor (atomicModule: any) {
        this.schema = atomicModule.schema;
        this.loaded = false;
        this.item = new BehaviorSubject<any>({});
    }

    /*
     * on
     * @Params:
     * ref: Database Reference
     * */
    public on(ref: any): Promise<any> {
        this.eventListenerRef = ref;
        return new Promise((resolve, reject) => {
            this.eventListenerRef.on('value', snapshot => {
                if (snapshot.exists()) {
                    if (this.schema.dynamic) {
                        this.item.next(snapshot.val());
                    } else {
                        this.item.next(this.schema.build(snapshot, 'atomicObject'));
                    }
                }
                this.loaded = true;
                resolve(true);
            });
        });
    }


    public off(): void {
        this.eventListenerRef.off('value');
    }
}
