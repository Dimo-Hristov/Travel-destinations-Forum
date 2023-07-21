import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getDestinations(limit?: number) {
    const { appUrl } = environment;
    const limitFilter = limit ? `?sortBy=_createdOn%${limit}desc` : '';
    return this.http.get(`${appUrl}/destinations${limitFilter}`);
  }
}
