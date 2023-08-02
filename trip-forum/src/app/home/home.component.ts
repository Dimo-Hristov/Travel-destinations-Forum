import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { UserService } from '../user/user.service';
import { destination } from '../types/destination';
import { DestinationService } from '../destination/destination.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private destinationService: DestinationService
  ) {}

  lastThreeLikes: any = [];
  userId = this.userService.user._id;
  lastThreeLikedDestinations: destination[] = [];

  ngOnInit(): void {
    this.getLikes();
  }

  getLikes() {
    let likesList: any;
    this.apiService.getAllLikes().subscribe((res) => {
      likesList = res;
      this.filterLikes(likesList);
    });
  }

  filterLikes(likesList: any) {
    for (const like of likesList) {
      if (this.userId === like._ownerId) {
        this.lastThreeLikes.push(like);
      }
    }

    this.lastThreeLikes = this.lastThreeLikes.slice(-3);
    this.getLastThreeDestinations(this.lastThreeLikes);
  }

  getLastThreeDestinations(likesArray: any) {
    for (const like of likesArray) {
      this.apiService.getDestination(like.albumId).subscribe((res) => {
        this.lastThreeLikedDestinations.push(res);
      });
    }
    console.log(this.lastThreeLikedDestinations);
  }
}
