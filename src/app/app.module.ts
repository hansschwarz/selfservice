import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { TokenService } from './token.service';
import { TokenListComponent } from './token-list/token-list.component';
import { TokenComponent } from './token/token.component';


@NgModule({
  declarations: [
    AppComponent,
    TokenListComponent,
    TokenComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [TokenService],
  bootstrap: [AppComponent]
})
export class AppModule { }
