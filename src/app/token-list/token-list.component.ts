import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';

import { SelfserviceToken, EnrollmentStatus, tokenDisplayData } from '../api/token';
import { TokenService } from '../api/token.service';
import { Permission } from '../common/permissions';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-token-list',
  templateUrl: './token-list.component.html',
  styleUrls: ['./token-list.component.scss']
})

export class TokenListComponent implements OnInit {
  public EnrollmentStatus = EnrollmentStatus;
  public enrollmentPermissions: Permission[] = tokenDisplayData.map(tt => tt.enrollmentPermission).filter(p => !!p);

  public tokens: SelfserviceToken[];
  public permissionsLoaded: boolean;

  constructor(
    private tokenService: TokenService,
    private loginService: LoginService,
  ) { }

  ngOnInit() {
    this.loadTokens();

    this.loginService.permissionLoad$.pipe(take(1)).subscribe(permissionsLoaded => {
      this.permissionsLoaded = permissionsLoaded;
    });
  }

  loadTokens() {
    this.tokenService.getTokens().subscribe(tokens => {
      this.tokens = tokens;
    });
  }

}
