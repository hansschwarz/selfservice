import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CookieModule } from 'ngx-cookie';
import { CustomFormsModule } from 'ng2-validation';

import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material.module';

import { AppComponent } from './app.component';
import { TokenService, TokenListResolver, TokenDetailResolver } from './token.service';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth-guard.service';
import { TokenListComponent } from './token-list/token-list.component';
import { LoginComponent } from './login/login.component';
import { TokenActivateComponent } from './token-activate/token-activate.component';
import { TokenActivateTypeDirective } from './token-activate/token-activate-type.directive';
import { TokenActivatePushComponent } from './token-activate/token-activate-push/token-activate-push.component';
import { DialogComponent } from './dialog/dialog.component';
import { SetPinDialogComponent } from './set-pin-dialog/set-pin-dialog.component';
import { EnrollComponent } from './enroll/enroll.component';
import { EnrollTotpComponent } from './enroll/enroll-totp/enroll-totp.component';
import { EnrollHotpComponent } from './enroll/enroll-hotp/enroll-hotp.component';
import { EnrollPushComponent } from './enroll/enroll-push/enroll-push.component';


@NgModule({
  declarations: [
    AppComponent,
    TokenListComponent,
    LoginComponent,
    TokenActivateComponent,
    TokenActivateTypeDirective,
    TokenActivatePushComponent,
    DialogComponent,
    SetPinDialogComponent,
    EnrollComponent,
    EnrollTotpComponent,
    EnrollHotpComponent,
    EnrollPushComponent,
  ],
  entryComponents: [
    TokenActivatePushComponent,
    DialogComponent,
    SetPinDialogComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CookieModule.forRoot(),
    CustomFormsModule,
    AppRoutingModule,
    MaterialModule,
  ],
  providers: [
    TokenService,
    AuthService,
    AuthGuard,
    TokenDetailResolver,
    TokenListResolver,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
