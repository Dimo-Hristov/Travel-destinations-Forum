import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from '../main/main.component';
import { AddDestinationComponent } from './add-destination/add-destination.component';

const routes: Routes = [
  { path: 'destinations', component: MainComponent },
  { path: 'add-destination', component: AddDestinationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DestinationRoutingModule {}
