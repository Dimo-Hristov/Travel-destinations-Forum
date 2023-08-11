import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './loader/loader.component';
import { BackToTopButtonComponent } from './back-to-top-button/back-to-top-button.component';

@NgModule({
  declarations: [LoaderComponent, BackToTopButtonComponent],
  imports: [CommonModule],
  exports: [LoaderComponent],
})
export class SharedModule {}
