import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddDestinationComponent } from './add-destination/add-destination.component';
import { CurrentDestinationComponent } from './current-destination/current-destination.component';
import { DestinationRoutingModule } from './destination-routing.module';

@NgModule({
  declarations: [AddDestinationComponent, CurrentDestinationComponent],
  imports: [CommonModule, DestinationRoutingModule],
})
export class DestinationModule {}
