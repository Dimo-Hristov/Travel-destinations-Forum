import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddDestinationComponent } from './add-destination/add-destination.component';
import { CurrentDestinationComponent } from './current-destination/current-destination.component';
import { DestinationRoutingModule } from './destination-routing.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [AddDestinationComponent, CurrentDestinationComponent],
  imports: [CommonModule, DestinationRoutingModule, FormsModule],
})
export class DestinationModule {}
