import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { destination } from './types/destination';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private appUrl = environment.appUrl;
  constructor(private http: HttpClient) {}

  getDestinations() {
    return this.http.get<destination[]>(`${this.appUrl}/destinations`);
  }

  getAllLikes() {
    return this.http.get(`${this.appUrl}/data/likes`);
  }
}
