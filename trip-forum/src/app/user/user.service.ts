import { Injectable } from '@angular/core';

const USER_KEY = '[user]';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: any | undefined;

  get isLogged(): boolean {
    return !!this.isLogged;
  }

  constructor() {
    try {
      const lsUSer = localStorage.getItem(USER_KEY) || '';
      this.user = JSON.parse(lsUSer);
    } catch (error) {
      this.user = undefined;
    }
  }

  login(): void {}
  logout(): void {
    this.user = undefined;
    localStorage.removeItem(USER_KEY);
  }
}
