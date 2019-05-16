import { Token } from '../app/api/token';

export class Fixtures {

  static get activeHotpToken(): Token {
    return new Token(1, 'Active-Hotp-Token-Serial', 'hotp', true, 'Description');
  }

  static get activePushToken(): Token {
    return new Token(2, 'Active-PushToken-Serial', 'push', true, 'Description');
  }

  static get inactiveHotpToken(): Token {
    return new Token(3, 'Inactive-Hotp-Token-Serial', 'hotp', false, 'Description');
  }

  static get inactivePushToken(): Token {
    return new Token(2, 'Inactive-PushToken-Serial', 'push', false, 'Description');
  }

  static get tokens(): Token[] {
    return [
      this.activeHotpToken,
      this.activePushToken,
    ];
  }

  static get enrollmentResponse() {
    return {
      result: {
        value: false
      }
      ,
      detail: {
        googleurl: {
          value: 'testUrl',
        },
        lse_qr_url: {
          value: 'testUrl',
        },
        serial: 'testSerial',
      }
    };
  }

  static get activationResponse() {
    return {
      result: {
        value: true
      },
      detail: {
        transactionid: 1
      }
    };
  }

  static get hmacTokenType() {
    return {
      type: 'hmac',
      name: 'test hmac',
      description: 'desc',
      icon: 'icon',
    };
  }

  static get pushTokenType() {
    return {
      type: 'push',
      name: 'test push',
      description: 'desc',
      icon: 'icon'
    };
  }
}
