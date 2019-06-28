import { Component, OnInit, Inject } from '@angular/core';
import { TokenService } from '../../api/token.service';
import { Token, EnrollmentStatus } from '../../api/token';
import { MAT_DIALOG_DATA, MatDialogRef, MatStepper } from '@angular/material';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs/index';

@Component({
  selector: 'app-test-push',
  templateUrl: './test-push-dialog.component.html',
  styleUrls: ['./test-push-dialog.component.scss']
})
export class TestPushDialogComponent implements OnInit {
  public waitingForResponse: boolean;
  public restartDialog: boolean;
  public isActivation = false;
  public transactionId: string = null;
  public pin = '';

  constructor(
    private tokenService: TokenService,
    private dialogRef: MatDialogRef<TestPushDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { token: Token },
  ) {
    if (data.token.enrollmentStatus !== EnrollmentStatus.COMPLETED) {
      this.isActivation = true;
    }
  }

  public ngOnInit() {
    this.waitingForResponse = false;
  }

  public activateToken(stepper: MatStepper): void {

    this.restartDialog = false;
    this.waitingForResponse = true;
    stepper.next();

    this.tokenService.activate(this.data.token.serial, this.pin).pipe(
      map(response => response.detail.transactionid),
      tap(transactionId => this.transactionId = transactionId.toString().slice(0, 6)),
      switchMap(transactionId => this.tokenService.challengePoll(transactionId, this.pin, this.data.token.serial)),
      catchError(this.handleError('token activation', false)),
    ).subscribe((res: boolean) => {
      this.waitingForResponse = false;
      if (res === true) {
        this.restartDialog = false;
      } else {
        this.restartDialog = true;
      }
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      console.error(error);
      return of(result as T);
    };
  }

  public cancelDialog() {
    this.dialogRef.close(false);
  }

  public closeDialog() {
    this.dialogRef.close(true);
  }

  /**
   * Resets the dialog to the initial state and
   * alows to restart the activation process
   */
  public resetDialogToInitial(stepper: MatStepper) {
    stepper.reset();
  }

}
