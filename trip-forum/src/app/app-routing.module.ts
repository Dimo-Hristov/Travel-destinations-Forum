import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DestinationsListComponent } from './destinations-list/destinations-list.component';
import { MainComponent } from './main/main.component';
import { CurrentDestinationComponent } from './destination/current-destination/current-destination.component';
import { ProfileComponent } from './user/profile/profile.component';

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

  { path: 'destinations', component: DestinationsListComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
