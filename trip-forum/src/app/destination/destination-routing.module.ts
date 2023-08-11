import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from '../main/main.component';
import { AddDestinationComponent } from './add-destination/add-destination.component';
import { CurrentDestinationComponent } from './current-destination/current-destination.component';
import { EditDestinationComponent } from './edit-destination/edit-destination.component';
import { AuthGuard } from '../shared/auth-guard/guard.guard';

const routes: Routes = [
  {
    path: 'add-destination',
    component: AddDestinationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'edit-destination',
    component: EditDestinationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'destinations',
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: MainComponent,
      },
      {
        path: ':destinationId',
        component: CurrentDestinationComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DestinationRoutingModule {}
