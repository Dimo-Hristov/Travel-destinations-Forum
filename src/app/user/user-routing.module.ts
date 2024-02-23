import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { CurrentDestinationComponent } from '../destination/current-destination/current-destination.component';
import { AuthGuard } from '../shared/auth-guard/auth.guard';
import { AuthRedirectGuard } from '../shared/auth-guard/auth-redirect.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthRedirectGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthRedirectGuard],
  },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  {
    path: 'profile',
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: ProfileComponent,
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
export class UserRoutingModule {}
