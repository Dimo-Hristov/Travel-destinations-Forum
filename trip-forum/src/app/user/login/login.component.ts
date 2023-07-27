import { Component } from '@angular/core';
import { UserService } from '../user.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  constructor(private userService: UserService) {}

  loginHandler(form: NgForm): void {
    console.log(form.value);

    // this.userService.login(email, password).subscribe((res) => {
    //   localStorage.setItem('user', JSON.stringify(res));
    // });
  }
}
