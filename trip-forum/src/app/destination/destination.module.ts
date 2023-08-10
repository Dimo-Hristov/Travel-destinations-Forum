import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddDestinationComponent } from './add-destination/add-destination.component';
import { CurrentDestinationComponent } from './current-destination/current-destination.component';
import { DestinationRoutingModule } from './destination-routing.module';
import { FormsModule } from '@angular/forms';
import { UserModule } from '../user/user.module';
import { EditDestinationComponent } from './edit-destination/edit-destination.component';
import { CommentsComponent } from '../comments/comments.component';

@NgModule({
  declarations: [
    AddDestinationComponent,
    CurrentDestinationComponent,
    EditDestinationComponent,
    CommentsComponent,
  ],
  imports: [CommonModule, DestinationRoutingModule, FormsModule, UserModule],
})
export class DestinationModule {}
