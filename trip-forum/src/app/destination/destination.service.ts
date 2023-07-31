import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { UserService } from '../user/user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DestinationService {
  private appUrl = environment.appUrl;

  private endPoints = {
    getDestination: '/data/fruits?sortBy=_createdOn%20desc',
    addDestination: '/data/destinations',
    details: '/data/destinations/',
    edit: '/data/destinations/',
    deleteDestination: '/data/destinations/',
    search1: '/data/fruits?where=name%20LIKE%20%22',
    search2: '%22',
    like: '/data/likes',
  };

  constructor(private http: HttpClient, private userService: UserService) {}

  addDestination(data: object): Observable<any> {
    const accessToken = this.userService.user.accessToken;
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      'X-Authorization': accessToken,
    });

    return this.http.post(
      `${this.appUrl}${this.endPoints.addDestination}`,
      JSON.stringify(data),
      { headers }
    );
  }

  likeDestination(destinationId: string): Observable<any> {
    const accessToken = this.userService.user.accessToken;
    const headers = new HttpHeaders({
      'content-type': 'application/json',
      'X-Authorization': accessToken,
    });
    const data = {
      destinationId: destinationId,
    };

    return this.http.post(
      `${this.appUrl}${this.endPoints.like}`,
      JSON.stringify(data),
      { headers }
    );
  }
}
