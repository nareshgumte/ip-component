import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ShIpAddressComponent } from './sh-ip-address.component';

@NgModule({
  declarations: [ ShIpAddressComponent ],
  imports: [ CommonModule, FormsModule ],
  exports: [ ShIpAddressComponent ]
})
export class ShIpAddressModule {
}

