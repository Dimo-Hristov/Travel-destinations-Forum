import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';
import { SearchDirective } from './search.directive';

@NgModule({
  declarations: [HeaderComponent, FooterComponent, SearchDirective],
  imports: [CommonModule, RouterModule],
  exports: [FooterComponent, HeaderComponent],
})
export class CoreModule {}
