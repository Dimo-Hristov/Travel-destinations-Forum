import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/shared/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  constructor(private auth: AuthService) {}

  loginHandler(form: NgForm) {
    const value: { email: string; password: string } = form.value;

    this.auth.login(value.email, value.password);

    value.email = '';
    value.password = '';
  }
}
