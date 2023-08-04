import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DestinationsListComponent } from './destinations-list/destinations-list.component';
import { MainComponent } from './main/main.component';
import { CurrentDestinationComponent } from './destination/current-destination/current-destination.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'main' },
  { path: 'main', component: MainComponent },
  {
    path: 'main',
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: MainComponent,
      },
      {
        path: ':destinationType',
        component: DestinationsListComponent,
      },
      {
        path: ':destinationType/:destinationId',
        component: CurrentDestinationComponent,
      },
    ],
  },
  { path: 'home', component: HomeComponent },
  { path: 'destinations', component: DestinationsListComponent },
  {
    path: 'home',
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: HomeComponent,
      },
      {
        path: ':destinationId',
        component: CurrentDestinationComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
