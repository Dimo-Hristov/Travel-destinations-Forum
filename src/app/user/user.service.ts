import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public user: any | undefined;
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

  public getAuthHeaders() {
    const accessToken = this.user.accessToken;
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      'X-Authorization': accessToken,
    });
    return headers;
  }

  private appUrl = environment.appUrl;

  private endpoints = {
    login: '/auth/login',
    register: '/auth/register',
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
    const headers = this.getAuthHeaders();
    this.http
      .get(`${this.appUrl}/users/logout`, { headers })
      .subscribe((res) => {
        this.user = undefined;
        localStorage.removeItem(this.USER_KEY);
      });
  }
}
