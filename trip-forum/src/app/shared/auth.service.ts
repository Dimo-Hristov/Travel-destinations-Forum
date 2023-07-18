import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private fireAuth: AngularFireAuth, private router: Router) {

    // login method
    login(email: String , password: String){
      this.fireAuth.signInWithEmailAndPassword(email, password).then(() => {
        localStorage.setItem('token', 'true');
        this.router.navigate(['/home'])
      }, err =>{
        alert('Something went wrong')
        this.router.navigate(['/login'])
      })
    }
  }
}
