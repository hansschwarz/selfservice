import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, Validators, FormBuilder, NgForm } from '@angular/forms';

import { Token } from '../../api/token';
import { TokenService } from '../../api/token.service';

enum TestState {
  UNTESTED = 'untested',
  SUCCESS = 'success',
  FAILURE = 'failure',
}

@Component({
  selector: 'app-test-otp-dialog',
  templateUrl: './test-otp-dialog.component.html',
  styleUrls: ['./test-otp-dialog.component.scss']
})
export class TestOTPDialogComponent {

  public TestState = TestState;

  public state: TestState = TestState.UNTESTED;
  public testResult: boolean;
  public formGroup: FormGroup;

  @ViewChild('formDirective')
  public formDirective: NgForm;

  constructor(
    @Inject(MAT_DIALOG_DATA) public token: Token,
    private tokenService: TokenService,
    private formBuilder: FormBuilder,
  ) {
    this.formGroup = this.formBuilder.group({
      otp: ['', Validators.required],
      pin: [''],
    });
  }

  /**
   * Submit the OTP and set the component state to success or failure depending on the response.
   */
  public submit() {
    if (this.formGroup.valid) {
      const controls = this.formGroup.controls;
      this.tokenService.testToken(this.token.serial, controls.pin.value, controls.otp.value)
        .subscribe(result => {
          this.testResult = result;
          this.state = result ? TestState.SUCCESS : TestState.FAILURE;
        });
    }
  }

  /**
   * Returns the user to the empty input form, by setting the component state to untested and resetting the NgForm.
   *
   * @memberof TestOTPDialogComponent
   */
  public reset() {
    this.formDirective.resetForm();
    this.state = TestState.UNTESTED;
  }
}
