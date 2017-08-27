/*
 * Custom ordering is not recommended for large sets of data
* */

export class AtomicPriority {
    private ref: any;
    private increment: any;
    private orderSelected: any;
    private childAdded: any;

    constructor(config: any, ref: any) {
        this.ref = ref;
        this.increment = 50000000;

        if (config === undefined || config === null) {
            this.orderSelected = 'dateAsc';
        } else {
            this.orderSelected = config.order;
        }
    }

    public getPriority(data: any): any {
        const self = this;
        if (self.orderSelected !== undefined) {
            if (typeof self.orderSelected === 'function') {
                return self.orderSelected(data);
            }else {
                return self[self.orderSelected]();
            }
        }else {
            return self.dateAsc();
        }
    }

    private dateDesc(): any {
        const currentClientTS = new Date().getTime();
        return -(currentClientTS);
    }

    private dateAsc(): any {
        return new Date().getTime();
    }

    public first(): Promise<any> {
        const self = this;
        const refQuery = self.ref.root.child(self.ref.primary)
            .orderByPriority()
            .limitToFirst(1);
        return new Promise(function(resolve, reject){
            refQuery.once('value')
                .then(function(snapshot){
                    if (snapshot.val()) {
                        let priority = 0;
                        snapshot.forEach(function(DataSnapshot) {
                            priority = DataSnapshot.getPriority();
                        });
                        resolve(priority / 2);
                    }else {
                        resolve(self.increment);
                    }
                })
                .catch(function(err){ reject(err); });
        });

    }

    public last(): Promise<any> {
        const self = this;
        const refQuery = self.ref.root.child(self.ref.primary)
            .orderByPriority()
            .limitToLast(1);
        return new Promise(function(resolve, reject){
            refQuery.once('value')
                .then(function(snapshot){
                    if (snapshot.val()) {
                        let priority = 0;
                        snapshot.forEach(function(DataSnapshot) {
                            priority = DataSnapshot.getPriority();
                        });
                        resolve(priority + self.increment);
                    }else {
                        resolve(self.increment);
                    }
                })
                .catch(function(err){ reject(err); });
        });
    }

    public previous(previousItem: any): Promise<any> {
        const self = this;
        const refQuery = self.ref.root.child(self.ref.primary)
            .orderByPriority()
            .endAt(previousItem.$priority)
            .limitToLast(2);
        return new Promise(function(resolve, reject){
            refQuery.once('value')
                .then(function(snapshot){
                    let acum = 0;
                    snapshot.forEach(function(itemSnapshot){
                        acum += itemSnapshot.getPriority();
                    });
                    resolve(acum / 2);
                })
                .catch(function(err){ reject(err); });
        });
    }

    public next(nextItem: any): Promise<any> {
        const self = this;
        const refQuery = self.ref.root.child(self.ref.primary)
            .orderByPriority()
            .startAt(nextItem.$priority)
            .limitToFirst(2);
        return new Promise(function(resolve, reject){
            refQuery.once('value')
                .then(function(snapshot){
                    let acum = 0;
                    snapshot.forEach(function(itemSnapshot){
                        acum += itemSnapshot.getPriority();
                    });
                    if (acum > nextItem.$priority) {
                        resolve(acum / 2);
                    } else {
                        self.last()
                            .then((lastPosition) => {
                                console.log(lastPosition);
                                resolve(lastPosition);
                            })
                            .catch((err) => {reject(err)})
                    }

                })
                .catch(function(err){ reject(err); });
        });
    }

    public isFirst(item: any): Promise<any> {
        const self = this;
        return new Promise(function(resolve, reject){
            self.first()
                .then(function(firstPosition){
                    if (item.$priority === firstPosition) {
                        resolve(true);
                    }else {
                        resolve(false);
                    }
                })
                .catch(function(err){ reject(err); });
        });
    }

    public isLast(item: any): Promise<any> {
        const self = this;
        return new Promise(function(resolve, reject){
            self.last()
                .then(function(lastPosition){
                    if (item.$priority === lastPosition) {
                        resolve(true);
                    }else {
                        resolve(false);
                    }
                })
                .catch(function(err){ reject(err); });
        });
    }
}
