import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { UserService } from '../user/user.service';
import { Observable } from 'rxjs';
import { destination } from '../types/destination';

@Injectable({
  providedIn: 'root',
})
export class DestinationService implements OnInit {
  private appUrl = environment.appUrl;
  userId: string | undefined;
  userEmail: string | undefined;

  ngOnInit(): void {
    this.userId = this.userService.user?._id;
    this.userEmail = this.userService.user?.email;
  }

  private endPoints = {
    getDestination: '/data/fruits?sortBy=_createdOn%20desc',
    addDestination: '/destinations',
    details: '/data/destinations/',
    edit: '/destinations',
    delete: '/destinations',
    search1: '/data/fruits?where=name%20LIKE%20%22',
    search2: '%22',
    like: '/destinations/like',
    // put destination id between 1 and 2
    likesList1: '/data/likes?where=albumId%3D%22',
    likesList2: '%22&distinct=_ownerId',
    likeCount1: '/data/likes?where=albumId%3D%22',
    likeCount2: '%22&distinct=_ownerId&count',
    getMyLikes: `/destinations/my-likes`,
  };

  constructor(private http: HttpClient, private userService: UserService) {}

  getDestination(id: string) {
    return this.http.get<destination>(`${this.appUrl}/destinations/${id}`);
  }

  addDestination(data: object): Observable<any> {
    const headers = this.userService.getAuthHeaders();
    return this.http.post(
      `${this.appUrl}${this.endPoints.addDestination}`,
      JSON.stringify(data),
      { headers }
    );
  }

  likeDestination(destinationId: string): Observable<any> {
    const headers = this.userService.getAuthHeaders();

    return this.http.get(
      `${this.appUrl}${this.endPoints.like}/${destinationId}`,
      { headers }
    );
  }

  getDestinationLikesList(destinationId: string): Observable<any> {
    return this.http.get(
      `${this.appUrl}${this.endPoints.likesList1}${destinationId}${this.endPoints.likesList2}`
    );
  }

  editDestination(destinationId: string, data: object): Observable<any> {
    const headers = this.userService.getAuthHeaders();

    return this.http.put(
      `${this.appUrl}${this.endPoints.edit}/${destinationId}`,
      JSON.stringify(data),
      { headers }
    );
  }

  getLikes() {
    const headers = this.userService.getAuthHeaders();
    return this.http.get(`${this.appUrl}${this.endPoints.getMyLikes}`, {
      headers,
    });
  }

  deleteDestination(destinationId: string): Observable<any> {
    const headers = this.userService.getAuthHeaders();

    return this.http.delete(
      `${this.appUrl}${this.endPoints.delete}/${destinationId}`,
      { headers }
    );
  }

  getDestinationLikesCount(destinationId: string): Observable<number> {
    return this.http.get<number>(
      `${this.appUrl}${this.endPoints.likeCount1}${destinationId}${this.endPoints.likeCount2}`
    );
  }
}
