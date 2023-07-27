import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user: any | undefined;
  private USER_KEY = 'user';

  get isLogged(): boolean {
    return !!this.user;
  }

  constructor(private http: HttpClient) {
    try {
      const lsUSer = localStorage.getItem(this.USER_KEY) || '';
      this.user = JSON.parse(lsUSer);
    } catch (error) {
      this.user = undefined;
    }
  }

  private appUrl = environment.appUrl;

  private endpoints = {
    login: '/users/login',
    register: '/users/register',
    logout: '/users/logout',
  };

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.appUrl}${this.endpoints.login}`, {
      email: email,
      password: password,
    });
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.appUrl}${this.endpoints.register}`, {
      email: email,
      password: password,
    });
  }

  logout(): void {
    this.user = undefined;
    localStorage.removeItem(this.USER_KEY);
  }
}
