import { Component } from '@angular/core';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { passwordsValidator } from 'src/app/shared/validators/match-passwords-validator';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.minLength(5)]],
    passGroup: this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(5)]],
        rePassword: ['', [Validators.required, Validators.minLength(5)]],
      },
      {
        validators: [passwordsValidator('password', 'rePassword')],
      }
    ),
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  registerHandler(): void {
    if (this.form.invalid) {
      return;
    }

    const form = this.form.value;
    const email = form.email;
    const password = form.passGroup?.password;

    if (email && password) {
      this.userService.register(email, password).subscribe(
        (res) => {
          alert('Successful register, please login.');
          this.router.navigate(['/login']);
        },
        (error) => {
          error.message;
        }
      );
    }
  }
}
