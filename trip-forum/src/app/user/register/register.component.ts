import { Component } from '@angular/core';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';

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
        validators: [],
      }
    ),
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  registerHandler(): void {
    console.log(this.form.value);

    // this.userService.register(email, password).subscribe((res) => {
    //   this.router.navigate(['/login']);
    // });
  }
}
