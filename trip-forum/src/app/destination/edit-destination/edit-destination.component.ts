import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-destination',
  templateUrl: './edit-destination.component.html',
  styleUrls: ['./edit-destination.component.css'],
})
export class EditDestinationComponent implements OnInit {
  destination: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.destination = params;
    });
  }

  setValues(form: NgForm) {
    form.value.inputDestination = this.destination.destination;
  }

  editDestinationhanlder(form: NgForm): void {}
}
