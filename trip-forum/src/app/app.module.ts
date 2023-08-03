import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { MainComponent } from './main/main.component';
import { DestinationsListComponent } from './destinations-list/destinations-list.component';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { UserModule } from './user/user.module';
import { DestinationModule } from './destination/destination.module';
import { HomeComponent } from './home/home.component';
import { UploadedDestinationsComponent } from './uploaded-destinations/uploaded-destinations.component';
import { DestinationsListByTypeComponent } from './destinations-list-by-type/destinations-list-by-type.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    DestinationsListComponent,
    HomeComponent,
    UploadedDestinationsComponent,
    DestinationsListByTypeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    UserModule,
    HttpClientModule,
    DestinationModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
