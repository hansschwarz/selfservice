import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Token } from '../token';
import { TokenService } from '../token.service';

@Component({
  selector: 'app-token-list',
  templateUrl: './token-list.component.html',
  styleUrls: ['./token-list.component.scss']
})

export class TokenListComponent implements OnInit {
  tokens: Token[];

  constructor(private router: Router, private route: ActivatedRoute, public tokenService: TokenService) {
  }

  ngOnInit() {
    this.route.data.subscribe((data: { tokens: Token[] }) => {
      this.tokens = data.tokens;
    });
  }

  selectToken(token: Token) {
    this.router.navigate(['/tokens', token.id]);
  }

  deleteToken(token: Token) {
    this.tokenService.deleteToken(token.serial).subscribe(
      _ => this.router.navigate(['/tokens'])
    );
  }
}
