import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationExtras } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie';

import { NgxPermissionsService } from 'ngx-permissions';
import { Permission } from '../common/permissions';
import { SystemService } from '../system.service';

export interface LoginOptions {
  username: string;
  password: string;
  realm?: string;
}

interface LoginResponse {
  needsSecondFactor: boolean;
  success: boolean;
  hasTokens?: boolean;
}

@Injectable()
export class AuthService {
  private _loginChangeEmitter: EventEmitter<boolean> = new EventEmitter();

  private baseUrl = `/userservice/`;
  private endpoints = {
    login: 'login',
    logout: 'logout',
    tokens: 'usertokenlist',
  };

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private permissionsService: NgxPermissionsService,
    private router: Router,
    private systemService: SystemService,
  ) { }

  /**
   * Sends a login request to the backend and acts based on the response.
   *
   * If the username and password are correct, but a 2nd factor is required for a successful login
   * (i.e. mfa_login policy is set), we request a list of tokens for the user, then trigger a second
   * factor transaction for the first available token on the list.
   *
   * Should the user have no tokens for a second factor authentication, the backend does not send an
   * empty list. Instead, depending on whether the policy mfa_passOnNoToken was set, it either sends
   * a successful authentication message or a failed one.
   *
   * If the login was successful, the user's permissions are loaded before finishing the login.
   *
   * @param {LoginOptions} loginOptions An object containing username, password and realm, if applicable.
   * @returns {Observable<LoginResponse>} An object with the state of login success, and whether a second step is required.
   * @memberof AuthService
   */
  login(loginOptions: LoginOptions): Observable<LoginResponse> {
    const url = this.baseUrl + this.endpoints.login;
    const secondFactorMessage = 'credential verified - additional authentication parameter required';

    const params = {
      login: loginOptions.username,
      password: loginOptions.password,
      realm: loginOptions.realm
    };

    if (params.realm === undefined) {
      delete params.realm;
    }

    interface FirstStepResponseType {
      detail: {
        message: string;
      };
      result: {
        status: boolean;
        value: boolean;
      };
    }

    return this.http.post<FirstStepResponseType>(url, params)
      .pipe(
        map(rsp => {
          return {
            needsSecondFactor: !!rsp && !!rsp.detail && !!rsp.detail.message && rsp.detail.message === secondFactorMessage,
            success: !!rsp && !!rsp.result && !!rsp.result.value && rsp.result.value === true
          };
        }),
        tap(loginState => this._loginChangeEmitter.emit(loginState.success)),
        switchMap(loginState => loginState.success ? // refresh permissions (but only if login was successful)
          this.refreshPermissions().pipe(map(() => loginState)) :
          of(loginState)
        ),
        switchMap(loginState => loginState.needsSecondFactor ?
          this.getSecondFactorSerial().pipe(
            switchMap(serial => serial === '' ?
              of({ needsSecondFactor: true, success: false, hasTokens: false }) :
              this.requestSecondFactorTransaction(loginOptions.username, serial).pipe(
                map(() => {
                  return { needsSecondFactor: true, success: false, hasTokens: true };
                })
              )
            )
          ) :
          of(loginState)
        ),
        catchError(this.handleError('login', { needsSecondFactor: null, success: false })),
      );
  }

  /**
   * Returns the serial of the token to be used for second factor authentication
   *
   * @returns {Observable<string>} token serial, empty string if no tokens available and null if an error occurred.
   * @memberof AuthService
   */
  private getSecondFactorSerial(): Observable<string> {
    const url = this.baseUrl + this.endpoints.tokens;
    const body = { active: 'true', session: this.getSession() };
    interface SecondStepResponseType {
      result: {
        status: boolean;
        value: {
          'LinOtp.TokenSerialnumber': string;
        }[];
      };
    }
    return this.http.post<SecondStepResponseType>(url, body)
      .pipe(
        switchMap(response => response.result.value.length > 0 ?
          of(response.result.value[0]['LinOtp.TokenSerialnumber']) :
          of('')
        ),
        catchError(this.handleError('getAvailableSecondFactors', null)),
      );
  }

  /**
   * Inform the backend of the token that the user intends to use in the 2nd login step.
   *
   * @param {string} username identifies the user attempting 2nd factor authentication
   * @param {string} serial identifies the token to be used during authentication
   */
  private requestSecondFactorTransaction(username: string, serial: string): Observable<any> {
    const url = this.baseUrl + this.endpoints.login;
    const body = {
      serial: serial,
      data: `Selfservice+Login+Request User:+${username}`,
      content_type: 0,
      session: this.getSession()
    };
    return this.http.post(url, body).pipe(
      catchError(this.handleError('requestSecondFactorTransaction', null))
    );
  }

  /**
   * Sent the OTP generated by the second factor token specified at the end of the first step.
   *
   * @param {string} otp OTP generated by the second factor and entered by the user.
   */
  loginSecondStep(otp: string): Observable<boolean> {
    const url = this.baseUrl + this.endpoints.login;
    const params = { otp: otp, session: this.getSession() };

    return this.http.post<{ result: { status: boolean, value: boolean } }>(url, params)
      .pipe(
        map(response => response && response.result && response.result.value === true),
        tap(success => this._loginChangeEmitter.emit(success)),
        switchMap(success => success ? // refresh permissions (but only if login was successful)
          this.refreshPermissions().pipe(map(() => success)) :
          of(success)
        )
      );
  }

  /**
   * sends a logout request to the backend and processes all frontend related tasks
   *
   * The user is redirected to the login page without storing the current route.
   *
   * @returns {Observable<any>}
   * @memberof AuthService
   */
  public logout(): Observable<any> {
    return this.http.get<any>(this.baseUrl + this.endpoints.logout)
      .pipe(
        map(response => response && response.result && response.result.value === true),
        tap(logoutSuccess => {
          if (logoutSuccess) {
            this.handleLogout(false);
          }
        }),
        catchError(this.handleError('logout', false))
      );
  }

  /**
   * handles a closed login session to clear up the frontend state
   *
   * - loginChangeEmitter is updated
   * - all persistent data is cleared
   * - the user is redirected to the login screen.
   *   If the parameter `storeCurrentRoute` is set to true, the current router url
   *   will be stored so that the application returns to the current view once the
   *   user logs back in.
   *
   * @param {boolean} storeCurrentRoute
   * @memberof AuthService
   */
  public handleLogout(storeCurrentRoute: boolean) {
    localStorage.removeItem('permissions');
    this.permissionsService.flushPermissions();

    const navigationExtras: NavigationExtras = {};
    if (storeCurrentRoute) {
      navigationExtras.queryParams = { 'redirect': this.router.url };
    }
    this.router.navigate(['/login'], navigationExtras);

    this._loginChangeEmitter.emit(false);
  }

  /**
   * requests the permissions for the currently logged in user.
   *
   * This is done by evaluating the selfservice context that provides the
   * policy actions. They get mapped to the frontend permissions and are loaded
   * into the NgxPermissionsService.
   *
   * @returns {Observable<Permission[]>}
   * @memberof AuthService
   */
  public refreshPermissions(): Observable<Permission[]> {
    return this.systemService.getUserSystemInfo().pipe(
      map(systemInfo => systemInfo.permissions),
      tap(permissions => {
        localStorage.setItem('permissions', JSON.stringify(permissions));
        this.permissionsService.loadPermissions(permissions);
      }),
      catchError(this.handleError('loadPermissions', [])),
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      console.error(error);
      return of(result as T);
    };
  }

  /*
   * TODO: Make a request to the backend to check wheither the cookie
   *       is still valid or not and convert function to an Observable
   *       to keep a channel open for later
   */
  isLoggedIn(): boolean {
    const session = this.getSession();
    return !!session;
  }

  getSession(): string {
    return this.cookieService.get('user_selfservice');
  }

  get loginChangeEmitter(): Observable<boolean> {
    return this._loginChangeEmitter.asObservable();
  }

}
