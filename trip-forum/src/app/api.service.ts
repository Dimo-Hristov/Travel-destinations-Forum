import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { destination } from './types/destination';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getDestination(id: string) {
    const { appUrl } = environment;

    return this.http.get<destination>(`${appUrl}/data/destinations/${id}`);
  }

  getDestinations() {
    const { appUrl } = environment;

    return this.http.get<destination[]>(`${appUrl}/data/destinations`);
  }
}
