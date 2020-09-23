import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { of } from 'rxjs';

import { I18nMock } from '../testing/i18n-mock-provider';
import { spyOnClass, getInjectedStub } from '../testing/spyOnClass';

import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';
import { SessionService } from './auth/session.service';
import { NotificationService } from './common/notification.service';
import { LoginService } from './login/login.service';
import { MockComponent } from '../testing/mock-component';


const navLinks = [
  { 'label': 'label', 'path': 'path/' },
];

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
        MockComponent({ selector: 'app-language-picker' }),
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
    loginService = getInjectedStub(LoginService);
    sessionService = getInjectedStub(SessionService);

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

  it('should render navigation list if user is logged in', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    component.isLoggedIn = true;
    component.navLinks = navLinks;
    fixture.detectChanges();
    expect(compiled.querySelector('nav').textContent).toContain(navLinks[0].label);
  }));

  it('should not render navigation list if user is logged out', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    component.isLoggedIn = false;
    component.navLinks = navLinks;
    fixture.detectChanges();
    expect(compiled.querySelector('nav').textContent).not.toContain(navLinks[0].label);
  }));
});
