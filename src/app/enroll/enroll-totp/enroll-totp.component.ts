import { Component, OnInit } from '@angular/core';
import { EnrollToken } from '../../token';
import { TokenService } from '../../token.service';

export interface EnrollTotpToken extends EnrollToken {
  type: 'totp';
  otplen: number;
  hashlib: string;
  genkey: number;
  timeStep: number;
}

@Component({
  selector: 'app-enroll-totp',
  templateUrl: './enroll-totp.component.html',
  styleUrls: ['./enroll-totp.component.scss']
})
export class EnrollTotpComponent implements OnInit {

  public enrollData: EnrollTotpToken = {
    type: 'totp',
    description: '',
    otplen: 6,
    hashlib: 'sha1',
    genkey: 1,
    timeStep: 30,
  };

  constructor(private tokenService: TokenService) { }

  ngOnInit() {
  }

  enroll() {
    this.tokenService.enroll(this.enrollData).subscribe();
  }
}
