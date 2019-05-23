import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material.module';

import { NotificationService } from './notification.service';

import { DialogComponent } from './dialog/dialog.component';
import { SetPinDialogComponent } from './set-pin-dialog/set-pin-dialog.component';

import { UnreadyTokensPipe } from './pipes/unready-tokens.pipe';
import { ActiveTokensPipe } from './pipes/active-tokens.pipe';
import { InactiveTokensPipe } from './pipes/inactive-tokens.pipe';
import { ArrayNotEmptyPipe } from './pipes/array-not-empty.pipe';
import { SortTokensByStatePipe } from './pipes/sort-tokens-by-state.pipe';
import { QRCodeComponent } from './qr-code/qr-code.component';
import { QRCodeModule } from 'angularx-qrcode';
import { CapitalizePipe } from '../common/pipes/capitalize.pipe';


@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QRCodeModule,
  ],
  declarations: [
    QRCodeComponent,
    DialogComponent,
    SetPinDialogComponent,
    UnreadyTokensPipe,
    ActiveTokensPipe,
    InactiveTokensPipe,
    ArrayNotEmptyPipe,
    SortTokensByStatePipe,
    CapitalizePipe,
  ],
  entryComponents: [
    DialogComponent,
    SetPinDialogComponent,
  ],
  providers: [
    NotificationService,
  ],
  exports: [
    QRCodeComponent,
    UnreadyTokensPipe,
    ActiveTokensPipe,
    InactiveTokensPipe,
    ArrayNotEmptyPipe,
    SortTokensByStatePipe,
    CapitalizePipe,
  ]
})
export class NgSelfServiceCommonModule { }
