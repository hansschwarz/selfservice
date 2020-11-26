import { TestBed, inject } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Fixtures } from '../../testing/fixtures';

import { Token, EnrollmentStatus, TokenType } from './token';
import { SessionService } from '../auth/session.service';
import { NotificationService } from '../common/notification.service';
import { EnrollmentService } from './enrollment.service';
import { spyOnClass, getInjectedStub } from '../../testing/spyOnClass';

const session = '';

const mockReadyEnabledToken = new Token(1, 'serial', Fixtures.tokenTypeDetails[TokenType.UNKNOWN], true, 'desc');
mockReadyEnabledToken.enrollmentStatus = EnrollmentStatus.COMPLETED;

const mockReadyDisabledToken = new Token(2, 'serial2', Fixtures.tokenTypeDetails[TokenType.UNKNOWN], false, 'desc');
mockReadyDisabledToken.enrollmentStatus = EnrollmentStatus.COMPLETED;

const mockUnreadyDisabledToken = new Token(3, 'serial3', Fixtures.tokenTypeDetails[TokenType.UNKNOWN], false, 'desc');
mockUnreadyDisabledToken.enrollmentStatus = EnrollmentStatus.UNPAIRED;


describe('EnrollmentService', () => {
  let enrollmentService: EnrollmentService;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EnrollmentService,
        {
          provide: SessionService,
          useValue: {
            isLoggedIn: jasmine.createSpy('isLoggedIn'),
            login: jasmine.createSpy('login'),
            logout: jasmine.createSpy('logout'),
            getSession: jasmine.createSpy('getSession').and.returnValue(session),
          }
        },
        {
          provide: NotificationService,
          useValue: spyOnClass(NotificationService),
        },
      ],
    });

    enrollmentService = TestBed.inject(EnrollmentService);
    notificationService = getInjectedStub(NotificationService);

  });

  it('should be created', inject([EnrollmentService], (service: EnrollmentService) => {
    expect(service).toBeTruthy();
  }));

  describe('enrollChallenge', () => {
    [
      { type: TokenType.TOTP, enrollmentType: 'totp' },
      { type: TokenType.HOTP, enrollmentType: 'hmac' },
      { type: TokenType.PUSH, enrollmentType: null },
    ].forEach(({ type, enrollmentType }) => {
      it(`should use the enrollmentType for ${type}`, inject(
        [HttpClient, HttpTestingController],
        (http: HttpClient, backend: HttpTestingController) => {
          enrollmentService.enroll({
            type: type,
          }).subscribe(response => {
            expect(response).toEqual(null);
          });

          const expectedType = enrollmentType ? enrollmentType : type;
          const enrollRequest = backend.expectOne((req) => req.body.type === expectedType);

          enrollRequest.flush(null);
          backend.verify();
        }
      ));
    });
  });

  describe('enroll', () => {
    it('should notify the user of an error if the response status is not a success', inject(
      [HttpClient, HttpTestingController],
      (http: HttpClient, backend: HttpTestingController) => {

        enrollmentService.enroll({ type: TokenType.HOTP }).subscribe(res => {
          expect(notificationService.message).toHaveBeenCalledWith('Token registration failed: Please try again.');
        });

        const request = backend.expectOne((req) => req.body.type === 'hmac');
        request.flush({ result: { status: false } });

        backend.verify();
      }));
  });

  describe('assign', () => {
    it('should request a token assignment from the server', inject(
      [HttpClient, HttpTestingController],
      (http: HttpClient, backend: HttpTestingController) => {

        enrollmentService.assign('serial', 'description').subscribe(response => {
          expect(response).toEqual({ success: true });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');

        request.flush({ result: { status: true, value: { 'assign token': true } } });
        backend.verify();
      }
    ));

    it('should return an error message if the token is already assigned', inject(
      [HttpClient, HttpTestingController],
      (http: HttpClient, backend: HttpTestingController) => {
        const returnedMessage = 'The token is already assigned to you or to another user. Please contact an administrator.';

        enrollmentService.assign('serial', 'description').subscribe(response => {
          expect(response).toEqual({ success: false, message: returnedMessage });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');
        const receivedMessage = 'The token is already assigned to another user.';

        request.flush({ result: { status: true, error: { message: receivedMessage } } });
        backend.verify();

      }
    ));

    it('should return an error message if the token is in another realm', inject(
      [HttpClient, HttpTestingController],
      (http: HttpClient, backend: HttpTestingController) => {
        const returnedMessage = 'The token you want to assign is not valid (wrong realm). Please contact an administrator.';

        enrollmentService.assign('serial', 'description').subscribe(response => {
          expect(response).toEqual({ success: false, message: returnedMessage });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');
        const receivedMessage = 'The token you want to assign is  not contained in your realm!';

        request.flush({ result: { status: true, error: { message: receivedMessage } } });
        backend.verify();
      }
    ));

    it('should return a generic error message if an unknown error is received', inject(
      [HttpClient, HttpTestingController],
      (http: HttpClient, backend: HttpTestingController) => {
        const returnedMessage = 'Please try again or contact an administrator.';

        enrollmentService.assign('serial', 'description').subscribe(response => {
          expect(response).toEqual({ success: false, message: returnedMessage });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');
        const receivedMessage = 'some error message';

        request.flush({ result: { status: true, error: { message: receivedMessage } } });
        backend.verify();
      }
    ));

    it('should return a generic error message if neither error nor success is received', inject(
      [HttpClient, HttpTestingController],
      (http: HttpClient, backend: HttpTestingController) => {
        const returnedMessage = 'Please try again or contact an administrator.';

        enrollmentService.assign('serial', 'description').subscribe(response => {
          expect(response).toEqual({ success: false, message: returnedMessage });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');

        request.flush({ result: { status: false } });
        backend.verify();
      }
    ));

    it('should call the error handler on request failure', inject(
      [HttpClient, HttpTestingController],
      (http: HttpClient, backend: HttpTestingController) => {

        spyOn(console, 'error');

        enrollmentService.assign('serial', 'description').subscribe(response => {
          expect(notificationService.message).toHaveBeenCalledWith('assign failed: Please try again.');
          expect(response).toEqual({ success: false });
        });

        const request = backend.expectOne((req) => req.url === '/userservice/assign' && req.method === 'POST');

        request.error(new ErrorEvent('Error assigning token'));
        backend.verify();
      }
    ));
  });

});
