import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Destination } from '../types/destination';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private afs: AngularFirestore) {}

  // add new destination
  addNewDestianation(destination: Destination) {
    destination.id = this.afs.createId();
    return this.afs.collection('/Destinations').add(destination);
  }

  // get all destinations
  getAllDestinations() {
    return this.afs.collection('/Destinations').snapshotChanges();
  }

  // delete destination
  deleteDestination(destination: Destination) {
    return this.afs.doc(`/Destinations/${destination.id}`).delete();
  }

  // update destination
  updateDestination(destination: Destination) {
    this.deleteDestination(destination);
    this.addNewDestianation(destination);
  }
}
