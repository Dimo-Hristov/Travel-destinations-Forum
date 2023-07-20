import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/shared/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  constructor(private auth: AuthService) {}

  registerHandler(form: NgForm) {
    const value: { email: string; password: string } = form.value;

    this.auth.register(value.email, value.password);

    value.email = '';
    value.password = '';
  }
}
