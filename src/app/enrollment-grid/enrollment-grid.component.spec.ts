import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { NgxPermissionsAllowStubDirective } from 'ngx-permissions';
import { of } from 'rxjs/internal/observable/of';

import { spyOnClass } from '../../testing/spyOnClass';
import { Fixtures } from '../../testing/fixtures';
import { I18nMock } from '../../testing/i18n-mock-provider';

import { MaterialModule } from '../material.module';
import { NotificationService } from '../common/notification.service';
import { TokenTypeDetails, TokenType } from '../api/token';
import { CapitalizePipe } from '../common/pipes/capitalize.pipe';
import { TokenService } from '../api/token.service';

import { EnrollmentGridComponent } from './enrollment-grid.component';
import { EnrollOATHDialogComponent } from '../enroll/enroll-oath-dialog/enroll-oath-dialog.component';
import { EnrollPushDialogComponent } from '../enroll/enroll-push-dialog/enroll-push-dialog.component';
import { TestChallengeResponseDialogComponent } from '../test/test-challenge-response/test-challenge-response-dialog.component';


describe('EnrollmentGridComponent', () => {
  let component: EnrollmentGridComponent;
  let fixture: ComponentFixture<EnrollmentGridComponent>;
  let notificationService: NotificationService;
  let tokenService: jasmine.SpyObj<TokenService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let tokenUpdateSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        RouterTestingModule,
      ],
      declarations: [
        EnrollmentGridComponent,
        NgxPermissionsAllowStubDirective,
        CapitalizePipe,
      ],
      providers: [
        {
          provide: NotificationService,
          useValue: spyOnClass(NotificationService),
        },
        {
          provide: TokenService,
          useValue: spyOnClass(TokenService),
        },
        {
          provide: MatDialog,
          useValue: spyOnClass(MatDialog)
        },
        I18nMock,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollmentGridComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.get(NotificationService);
    tokenService = TestBed.get(TokenService);
    matDialog = TestBed.get(MatDialog);
    tokenUpdateSpy = spyOn(component.tokenUpdate, 'next');

    (<any>tokenService).tokenTypeDetails = [Fixtures.tokenTypeDetails.hmac, Fixtures.tokenTypeDetails.push];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the HOTP dialog and update the token list when completed', fakeAsync(() => {
    const token = Fixtures.activeHotpToken;
    const tokenTypeDetails: TokenTypeDetails = token.typeDetails;

    const expectedEnrollDialogConfig = {
      width: '850px',
      autoFocus: false,
      disableClose: true,
      data: { tokenTypeDetails: tokenTypeDetails },
    };
    const expectedTestDialogConfig = {
      width: '650px',
      data: { token: token },
    };

    matDialog.open.and.returnValues({ afterClosed: () => of(token.serial) }, { afterClosed: () => of(true) });
    tokenService.getToken.and.returnValue(of(token));
    component.runEnrollmentWorkflow(tokenTypeDetails);
    tick();

    expect(matDialog.open).toHaveBeenCalledWith(EnrollOATHDialogComponent, expectedEnrollDialogConfig);
    expect(tokenService.getToken).toHaveBeenCalledWith(token.serial);
    // deactivated token test feature for next release:
    // expect(matDialog.open).toHaveBeenCalledWith(TestOATHDialogComponent, expectedTestDialogConfig);
    // expect(tokenUpdateSpy).toHaveBeenCalledTimes(2);
    expect(tokenUpdateSpy).toHaveBeenCalledTimes(1);
  }));

  it('should notify the user if there was an issue retrieving the token before the test', fakeAsync(() => {
    const tokenTypeDetails: TokenTypeDetails = Fixtures.tokenTypeDetails[TokenType.HOTP];

    const expectedEnrollDialogConfig = {
      width: '850px',
      autoFocus: false,
      disableClose: true,
      data: { tokenTypeDetails: tokenTypeDetails },
    };

    matDialog.open.and.returnValue({ afterClosed: () => of('serial') });
    tokenService.getToken.and.returnValue(of(null));
    component.runEnrollmentWorkflow(tokenTypeDetails);
    tick();

    expect(matDialog.open).toHaveBeenCalledTimes(1);
    expect(matDialog.open).toHaveBeenCalledWith(EnrollOATHDialogComponent, expectedEnrollDialogConfig);
    expect(notificationService.message).toHaveBeenCalledWith('There was a problem starting the token test, please try manually later.');
    expect(tokenUpdateSpy).toHaveBeenCalledTimes(1);
  }));

  it('should not notify the user if the enrollment was cancelled', fakeAsync(() => {
    const tokenTypeDetails: TokenTypeDetails = Fixtures.tokenTypeDetails[TokenType.HOTP];

    const expectedEnrollDialogConfig = {
      width: '850px',
      autoFocus: false,
      disableClose: true,
      data: { tokenTypeDetails: tokenTypeDetails },
    };

    matDialog.open.and.returnValue({ afterClosed: () => of(null) });
    component.runEnrollmentWorkflow(tokenTypeDetails);
    tick();

    expect(matDialog.open).toHaveBeenCalledTimes(1);
    expect(matDialog.open).toHaveBeenCalledWith(EnrollOATHDialogComponent, expectedEnrollDialogConfig);
    expect(notificationService.message).not.toHaveBeenCalled();
    expect(tokenUpdateSpy).toHaveBeenCalledTimes(1);
  }));

  it('should open the TOTP dialog and update the token list when completed', fakeAsync(() => {
    const token = Fixtures.activeTotpToken;
    const tokenTypeDetails: TokenTypeDetails = token.typeDetails;

    const expectedEnrollDialogConfig = {
      width: '850px',
      autoFocus: false,
      disableClose: true,
      data: { tokenTypeDetails: tokenTypeDetails },
    };
    const expectedTestDialogConfig = {
      width: '650px',
      data: { token: token },
    };

    matDialog.open.and.returnValues({ afterClosed: () => of(token.serial) }, { afterClosed: () => of(true) });
    tokenService.getToken.and.returnValue(of(token));
    component.runEnrollmentWorkflow(tokenTypeDetails);
    tick();

    expect(matDialog.open).toHaveBeenCalledWith(EnrollOATHDialogComponent, expectedEnrollDialogConfig);
    expect(tokenService.getToken).toHaveBeenCalledWith(token.serial);
    // deactivated token test feature for next release:
    // expect(matDialog.open).toHaveBeenCalledWith(TestOATHDialogComponent, expectedTestDialogConfig);
    // expect(tokenUpdateSpy).toHaveBeenCalledTimes(2);
    expect(tokenUpdateSpy).toHaveBeenCalledTimes(1);
  }));

  it('should open the Push dialog and trigger the token list updater', fakeAsync(() => {
    const token = Fixtures.unpairedPushToken;
    const tokenTypeDetails: TokenTypeDetails = token.typeDetails;

    const expectedEnrollDialogConfig = {
      width: '850px',
      autoFocus: false,
      disableClose: true,
    };

    const expectedTestDialogConfig = {
      width: '650px',
      data: { token: token },
    };

    matDialog.open.and.returnValues({ afterClosed: () => of(token.serial) }, { afterClosed: () => of(true) });
    tokenService.getToken.and.returnValue(of(token));
    component.runEnrollmentWorkflow(tokenTypeDetails);
    tick();

    expect(matDialog.open).toHaveBeenCalledWith(EnrollPushDialogComponent, expectedEnrollDialogConfig);
    expect(tokenService.getToken).toHaveBeenCalledWith(token.serial);
    expect(matDialog.open).toHaveBeenCalledWith(TestChallengeResponseDialogComponent, expectedTestDialogConfig);
    expect(tokenUpdateSpy).toHaveBeenCalledTimes(2);
    expect(notificationService.message).not.toHaveBeenCalled();
  }));

  it('should notify the user if the token cannot be enrolled', fakeAsync(() => {
    const tokenTypeDetails: TokenTypeDetails = Fixtures.tokenTypeDetails[TokenType.UNKNOWN];
    component.runEnrollmentWorkflow(tokenTypeDetails);
    tick();

    expect(matDialog.open).toHaveBeenCalledTimes(0);
    expect(tokenUpdateSpy).toHaveBeenCalledTimes(0);
    expect(notificationService.message).toHaveBeenCalledTimes(1);
    expect(notificationService.message).toHaveBeenCalledWith('The selected token type cannot be enrolled at the moment.');
  }));
});
