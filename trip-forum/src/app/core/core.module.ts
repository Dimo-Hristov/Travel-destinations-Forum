import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [FooterComponent, HeaderComponent],
  imports: [CommonModule, RouterModule],
  // components witch we export from core module
  exports: [HeaderComponent, FooterComponent],
})
export class CoreModule {}
