import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    private userService: UserService
  ) {}

  userLikes: any = [];
  userId = this.userService.user._id;

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
        this.userLikes.push(like);
      }
    }

    this.userLikes = this.userLikes.slice(0, 3);
    console.log(this.userLikes);
  }
}
