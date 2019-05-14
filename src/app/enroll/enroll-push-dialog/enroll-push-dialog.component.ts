import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatStepper, MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';

import { TokenService } from '../../api/token.service';
import { NotificationService } from '../../common/notification.service';

@Component({
  selector: 'app-enroll-push',
  templateUrl: './enroll-push-dialog.component.html',
  styleUrls: ['./enroll-push-dialog.component.scss']
})
export class EnrollPushDialogComponent implements OnInit {

  public enrollmentForm: FormGroup;
  public enrollmentStep: FormGroup;

  public isPaired: boolean;
  public readonly maxSteps: number = 3;
  public currentStep: number;

  public enrolledToken: { serial: string, url: string };

  constructor(
    private tokenService: TokenService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private router: Router,
    private dialogRef: MatDialogRef<EnrollPushDialogComponent>
  ) {
  }

  public ngOnInit() {
    this.currentStep = 1;
    this.enrollmentForm = this.formBuilder.group({
      'description': ['', Validators.required],
      'type': 'push',
    });
    this.enrollmentStep = this.formBuilder.group({
      'tokenEnrolled': ['', Validators.required],
    });
  }

  /**
   * Enroll the push token and proceed to the next step
   */
  goToTokenInfo(stepper: MatStepper) {
    this.tokenService.enroll(this.enrollmentForm.value).subscribe(response => {
      if (response.result && response.result.value === true) {
        this.enrolledToken = {
          url: response.detail.lse_qr_url.value,
          serial: response.detail.serial
        };

        this.enrollmentForm.controls.description.disable();
        this.enrollmentStep.controls.tokenEnrolled.setValue(true);

        this.tokenService.pairingPoll(this.enrolledToken.serial).subscribe(data => {
          this.isPaired = true;
          stepper.selectedIndex = 2;
        });

        this.incrementStep(stepper);

      } else {
        this.notificationService.message('There was a problem while enrolling the new token. Please try again.');
      }
    });
  }

  public goToActivation() {
    this.router.navigate(['/tokens', this.enrolledToken.serial, 'activate']);
    this.dialogRef.close();
  }

  /**
   * Increment the current step of the dialog for the view
   */
  public incrementStep(stepper: MatStepper) {
    stepper.next();
    this.currentStep++;
  }

  public cancelDialog() {
    this.dialogRef.close();
  }
}
