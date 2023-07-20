import { Component } from '@angular/core';
import { Destination } from '../types/destination';
import { AuthService } from '../shared/auth.service';
import { DataService } from '../shared/data.service';

@Component({
  selector: 'app-destinations-list',
  templateUrl: './destinations-list.component.html',
  styleUrls: ['./destinations-list.component.css'],
})
export class DestinationsListComponent {
  // destinationsList: Destination[] = [];
  // constructor(private auth: AuthService, private data: DataService) {}
  // getallDestinations() {
  //   this.data.getAllDestinations().subscribe(
  //     (res) => {
  //       this.destinationsList = res.map((e: any) => {
  //         const data = e.payload.doc.data();
  //         data.id = e.payload.doc.id;
  //         return data;
  //       });
  //     },
  //     (err) => {
  //       alert(err.message);
  //     }
  //   );
  // }
  // addDestination() {}
  // updateDestination() {}
  // deleteDestination(destination: Destination) {
  //   if (
  //     window.confirm(
  //       `Are you sure you want to delete ${destination.name} destination?`
  //     )
  //   ) {
  //     this.data.deleteDestination(destination);
  //   }
  // }
}
