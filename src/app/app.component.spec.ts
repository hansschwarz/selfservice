import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { of } from 'rxjs';

import { I18nMock } from '../testing/i18n-mock-provider';
import { spyOnClass } from '../testing/spyOnClass';

import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';
import { SessionService } from './auth/session.service';
import { NotificationService } from './common/notification.service';
import { LoginService } from './login/login.service';

describe('AppComponent', () => {
  let loginService: jasmine.SpyObj<LoginService>;
  let sessionService: jasmine.SpyObj<SessionService>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MaterialModule,
      ],
      declarations: [
        AppComponent,
      ],
      providers: [
        {
          provide: SessionService,
          useValue: spyOnClass(SessionService)
        },
        {
          provide: LoginService,
          useValue: spyOnClass(LoginService),
        },
        {
          provide: NotificationService,
          useValue: spyOnClass(NotificationService),
        },
        I18nMock,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    loginService = TestBed.get(LoginService);
    sessionService = TestBed.get(SessionService);

    loginService.logout.and.returnValue(of(null));
    sessionService.isLoggedIn.and.returnValue(of(null));
    (loginService as any).loginChangeEmitter = of();
  });

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'Self Service'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Self Service');
  }));

  it('should render title in a mat-toolbar tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('mat-toolbar').textContent).toContain('Self Service');
  }));
});
