import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  message: string;

  loginFormGroup: FormGroup;

  private redirectUrl: string;

  constructor(
    private authService: AuthService,
    public notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.loginFormGroup = new FormGroup({
      username: new FormControl(),
      password: new FormControl()
    });
  }

  ngOnInit() {
    this.route.queryParamMap
      .map(params => params.get('redirect'))
      .subscribe(url => this.redirectUrl = url);
  }

  login() {
    this.message = 'Waiting for response';

    const username = this.loginFormGroup.value.username;
    const password = this.loginFormGroup.value.password;

    this.authService.login(username, password).subscribe((result: boolean) => {

      const message = (result ? 'Login successful' : 'Login failed');
      this.notificationService.message(message);

      if (result) {
        this.redirect();
      }

    });
  }

  redirect() {
    const target = this.redirectUrl || '/';
    this.router.navigate([target]);
  }
}
