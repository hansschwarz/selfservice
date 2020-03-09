import { TestBed, async, inject } from '@angular/core/testing';
import { Fixtures } from '../../testing/fixtures';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TokenService } from './token.service';
import { Token, EnrollmentStatus, TokenType } from './token';
import { SessionService } from '../auth/session.service';
import { I18nMock } from '../../testing/i18n-mock-provider';

const session = '';

const mockReadyEnabledToken = new Token(1, 'serial', Fixtures.tokenTypeDetails[TokenType.UNKNOWN], true, 'desc');
mockReadyEnabledToken.enrollmentStatus = EnrollmentStatus.COMPLETED;

const mockReadyDisabledToken = new Token(2, 'serial2', Fixtures.tokenTypeDetails[TokenType.UNKNOWN], false, 'desc');
mockReadyDisabledToken.enrollmentStatus = EnrollmentStatus.COMPLETED;

const mockUnreadyDisabledToken = new Token(3, 'serial3', Fixtures.tokenTypeDetails[TokenType.UNKNOWN], false, 'desc');
mockUnreadyDisabledToken.enrollmentStatus = EnrollmentStatus.UNPAIRED;

const mockReadyEnabledMOTPToken = new Token(4, 'serial', Fixtures.tokenTypeDetails[TokenType.MOTP], true, 'desc');
mockReadyEnabledToken.enrollmentStatus = EnrollmentStatus.COMPLETED;

const mockTokens: Token[] = [mockReadyEnabledToken, mockReadyDisabledToken, mockUnreadyDisabledToken];

const mockResponse = {
  result: {
    value: [
      {
        'LinOtp.TokenId': mockReadyEnabledToken.id,
        'LinOtp.TokenSerialnumber': mockReadyEnabledToken.serial,
        'LinOtp.TokenType': mockReadyEnabledToken.typeDetails.type,
        'LinOtp.TokenDesc': mockReadyEnabledToken.description,
        'LinOtp.Isactive': mockReadyEnabledToken.enabled,
        'Enrollment': { 'status': mockReadyEnabledToken.enrollmentStatus }
      },
      {
        'LinOtp.TokenId': mockReadyDisabledToken.id,
        'LinOtp.TokenSerialnumber': mockReadyDisabledToken.serial,
        'LinOtp.TokenType': mockReadyDisabledToken.typeDetails.type,
        'LinOtp.TokenDesc': mockReadyDisabledToken.description,
        'LinOtp.Isactive': mockReadyDisabledToken.enabled,
        'Enrollment': { 'status': mockReadyDisabledToken.enrollmentStatus }
      },
      {
        'LinOtp.TokenId': mockUnreadyDisabledToken.id,
        'LinOtp.TokenSerialnumber': mockUnreadyDisabledToken.serial,
        'LinOtp.TokenType': mockUnreadyDisabledToken.typeDetails.type,
        'LinOtp.TokenDesc': mockUnreadyDisabledToken.description,
        'LinOtp.Isactive': mockUnreadyDisabledToken.enabled,
        'Enrollment': { 'status': 'not completed', 'detail': mockUnreadyDisabledToken.enrollmentStatus }
      }
    ]
  }
};

describe('TokenService', () => {
  let tokenService: TokenService;
  let httpClient: HttpClientTestingModule;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TokenService,
        {
          provide: SessionService,
          useValue: {
            isLoggedIn: jasmine.createSpy('isLoggedIn'),
            login: jasmine.createSpy('login'),
            logout: jasmine.createSpy('logout'),
            getSession: jasmine.createSpy('getSession').and.returnValue(session),
          }
        },
        I18nMock,
      ],
    });

    tokenService = TestBed.get(TokenService);
    httpClient = TestBed.get(HttpTestingController);
  });

  it('should be created', inject([TokenService], (service: TokenService) => {
    expect(service).toBeTruthy();
  }));

  describe('getTokens', () => {
    it('should request tokens from the server', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        tokenService.getTokens().subscribe(response => {
          expect(response).toEqual(mockTokens);
        });

        const tokenListRequest = backend.expectOne((req) => req.url === '/userservice/usertokenlist' && req.method === 'GET');

        tokenListRequest.flush(mockResponse);
        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.getTokens().subscribe(response => {
          expect(response).toEqual([]);
        });

        const tokenListRequest = backend.expectOne((req) => req.url === '/userservice/usertokenlist' && req.method === 'GET');

        tokenListRequest.error(new ErrorEvent('Error loading token list'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));

  });

  describe('enrollChallenge', () => {
    [
      { type: TokenType.TOTP, enrollmentType: 'googleauthenticator_time' },
      { type: TokenType.HOTP, enrollmentType: 'googleauthenticator' },
      { type: TokenType.PUSH, enrollmentType: null },
    ].forEach(({ type, enrollmentType }) => {
      it(`should use the enrollmentType for ${type}`, async(
        inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
          tokenService.enroll({
            type: type,
          }).subscribe(response => {
            expect(response).toEqual(null);
          });

          const expectedType = enrollmentType ? enrollmentType : type;
          const enrollRequest = backend.expectOne((req) => req.body.type === expectedType);

          enrollRequest.flush(null);
          backend.verify();
        })
      ));
    });
  });

  describe('getToken', () => {
    const token = mockReadyEnabledToken;
    it('should request a token from the server', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        tokenService.getToken(token.serial).subscribe(response => {
          expect(response).toEqual(token);
        });

        const tokenListRequest = backend.expectOne((req) => req.url === '/userservice/usertokenlist' && req.method === 'GET');

        tokenListRequest.flush(mockResponse);
        backend.verify();
      })
    ));
  });

  describe('set token pin', () => {
    const setPinRequestBody = { userpin: '01234', serial: 'serial', session: session };
    it('should send a pin request', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        tokenService.setPin(mockReadyEnabledToken, '01234').subscribe(res => {
          expect(res).toEqual(true);
        });

        const req = backend.expectOne({
          url: '/userservice/setpin',
          method: 'POST'
        });

        expect(req.request.body).toEqual(setPinRequestBody);
        req.flush({ result: { value: { 'set userpin': 1 } } });

        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.setPin(mockReadyEnabledToken, '01234').subscribe(response => {
          expect(response).toEqual(false);
        });
        const setPinRequest = backend.expectOne({
          url: '/userservice/setpin',
          method: 'POST'
        });

        setPinRequest.error(new ErrorEvent('Error setting token pin'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

  describe('set mOTP pin', () => {
    const setPinRequestBody = { pin: '01234', serial: 'serial', session: session };
    it('should send a mOTP pin request', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        tokenService.setMOTPPin(mockReadyEnabledMOTPToken, '01234').subscribe(res => {
          expect(res).toEqual(true);
        });

        const req = backend.expectOne({
          url: '/userservice/setmpin',
          method: 'POST'
        });

        expect(req.request.body).toEqual(setPinRequestBody);
        req.flush({ result: { value: { 'set userpin': 1 } } });

        backend.verify();
      })
    ));

    it('should not call the backend if the token is not an mOTP token', async(
      inject([HttpClient], (http: HttpClient) => {
        spyOn(http, 'post');

        tokenService.setMOTPPin(mockReadyEnabledToken, '01234').subscribe(response => {
          expect(response).toEqual(false);
          expect(http.post).not.toHaveBeenCalled();
        });
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.setMOTPPin(mockReadyEnabledMOTPToken, '01234').subscribe(response => {
          expect(response).toEqual(false);
        });
        const setPinRequest = backend.expectOne({
          url: '/userservice/setmpin',
          method: 'POST'
        });

        setPinRequest.error(new ErrorEvent('Error setting token pin'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

  describe('delete token', () => {
    const deleteRequestBody = { serial: 'serial', session: session };
    it('should send a delete request', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        tokenService.deleteToken('serial').subscribe();

        const req = backend.expectOne({
          url: '/userservice/delete',
          method: 'POST'
        });

        expect(req.request.body).toEqual(deleteRequestBody);
        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.deleteToken('serial').subscribe();
        const deleteRequest = backend.expectOne({
          url: '/userservice/delete',
          method: 'POST'
        });

        deleteRequest.error(new ErrorEvent('Error deleting token'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

  describe('enable token', () => {
    const enableRequestBody = { serial: mockReadyDisabledToken.serial, session: session };
    it('should send a enable token request', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        tokenService.enable(mockReadyDisabledToken).subscribe(res => {
          expect(res).toEqual(true);
        });

        const req = backend.expectOne({
          url: '/userservice/enable',
          method: 'POST'
        });

        expect(req.request.body).toEqual(enableRequestBody);
        req.flush({ result: { value: { 'enable token': 1 } } });

        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.enable(mockReadyDisabledToken).subscribe();
        const enableRequest = backend.expectOne({
          url: '/userservice/enable',
          method: 'POST'
        });

        enableRequest.error(new ErrorEvent('Error enabling token'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

  describe('disable token', () => {
    const disableRequestBody = { serial: mockReadyEnabledToken.serial, session: session };
    it('should send a disable token request', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        tokenService.disable(mockReadyEnabledToken).subscribe(res => {
          expect(res).toEqual(true);
        });

        const req = backend.expectOne({
          url: '/userservice/disable',
          method: 'POST'
        });

        expect(req.request.body).toEqual(disableRequestBody);
        req.flush({ result: { value: { 'disable token': 1 } } });

        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.disable(mockReadyEnabledToken).subscribe();
        const disableRequest = backend.expectOne({
          url: '/userservice/disable',
          method: 'POST'
        });

        disableRequest.error(new ErrorEvent('Error disabling token'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

  describe('resetFailcounter', () => {
    it('should request a failcounter reset from the server', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        tokenService.resetFailcounter('serial').subscribe(response => {
          expect(response).toEqual(true);
        });

        const request = backend.expectOne((req) => req.url === '/userservice/reset' && req.method === 'POST');

        request.flush({ result: { status: true, value: { 'reset Failcounter': 1 } } });
        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.resetFailcounter('serial').subscribe(response => {
          expect(response).toEqual(false);
        });

        const request = backend.expectOne((req) => req.url === '/userservice/reset' && req.method === 'POST');

        request.error(new ErrorEvent('Error resetting failcounter'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));

  });

  describe('resync', () => {
    it('should request a token resync from the server', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        tokenService.resync('serial', 'otp1', 'otp2').subscribe(response => {
          expect(response).toEqual(true);
        });

        const request = backend.expectOne((req) => req.url === '/userservice/resync' && req.method === 'POST');

        request.flush({ result: { status: true, value: { 'resync Token': true } } });
        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.resync('serial', 'otp1', 'otp2').subscribe(response => {
          expect(response).toEqual(false);
        });

        const request = backend.expectOne((req) => req.url === '/userservice/resync' && req.method === 'POST');

        request.error(new ErrorEvent('Error resyncing token'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

  describe('assign', () => {
    it('should request a token assignment from the server', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        tokenService.assign('serial').subscribe(response => {
          expect(response).toEqual({ success: true });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');

        request.flush({ result: { status: true, value: { 'assign token': true } } });
        backend.verify();
      })
    ));

    it('should return an error message if the token is already assigned', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        const returnedMessage = 'The token is already assigned to you or to another user. Please contact an administrator.';

        tokenService.assign('serial').subscribe(response => {
          expect(response).toEqual({ success: false, message: returnedMessage });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');
        const receivedMessage = 'The token is already assigned to another user.';

        request.flush({ result: { status: true, error: { message: receivedMessage } } });
        backend.verify();
      })
    ));

    it('should return an error message if the token is in another realm', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        const returnedMessage = 'The token you want to assign is not valid (wrong realm). Please contact an administrator.';

        tokenService.assign('serial').subscribe(response => {
          expect(response).toEqual({ success: false, message: returnedMessage });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');
        const receivedMessage = 'The token you want to assign is  not contained in your realm!';

        request.flush({ result: { status: true, error: { message: receivedMessage } } });
        backend.verify();
      })
    ));

    it('should return a generic error message if an unknown error is received', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        const returnedMessage = 'Please try again or contact an administrator.';

        tokenService.assign('serial').subscribe(response => {
          expect(response).toEqual({ success: false, message: returnedMessage });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');
        const receivedMessage = 'some error message';

        request.flush({ result: { status: true, error: { message: receivedMessage } } });
        backend.verify();
      })
    ));

    it('should return a generic error message if neither error nor success is received', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        const returnedMessage = 'Please try again or contact an administrator.';

        tokenService.assign('serial').subscribe(response => {
          expect(response).toEqual({ success: false, message: returnedMessage });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');

        request.flush({ result: { status: false } });
        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.assign('serial').subscribe(response => {
          expect(response).toEqual({ success: false });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');

        request.error(new ErrorEvent('Error assigning token'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

  describe('setDescription', () => {
    it('should request setting a token description from the server', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        tokenService.setDescription('serial', 'description').subscribe(response => {
          expect(response).toEqual({ success: true });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/setdescription' && req.method === 'POST');

        request.flush({ result: { status: true, value: { 'set description': true } } });
        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.setDescription('serial', 'description').subscribe(response => {
          expect(response).toEqual({ success: false });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/setdescription' && req.method === 'POST');

        request.error(new ErrorEvent('Error setting token description'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

  describe('testToken', () => {
    const testRequestBody = { serial: 'serial', otp: 'otp', session: session };
    it('should send a verify request', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {
        tokenService.testToken('serial', 'otp').subscribe();

        const req = backend.expectOne({
          url: '/userservice/verify',
          method: 'POST'
        });

        expect(req.request.body).toEqual(testRequestBody);
        backend.verify();
      })
    ));

    it('should call the error handler on request failure', async(
      inject([HttpClient, HttpTestingController], (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        tokenService.testToken('serial', 'otp').subscribe();
        const testRequest = backend.expectOne({
          url: '/userservice/verify',
          method: 'POST'
        });

        testRequest.error(new ErrorEvent('Error testing token'));
        backend.verify();

        expect(console.error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
      })
    ));
  });

});
