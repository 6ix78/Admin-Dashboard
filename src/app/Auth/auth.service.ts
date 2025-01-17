import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, tap } from 'rxjs';
import { SharedService } from '../shared/shared.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private rootURL = 'https://hashstore.onrender.com';
  private key =
    '5bf6b008a9ec05f6870c476d10b53211797aa000f95aae344ae60f9b422286da';
  authStatusListener$ = new BehaviorSubject<boolean>(true);
  private isAuthenticated = false;
  private token: string;
  private refersh: string;
  otpError$ = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private sharedService: SharedService
  ) {}
  getToken() {
    return this.token;
  }
  getRefersh() {
    return this.refersh;
  }
  getAuth() {
    return this.isAuthenticated;
  }

  signinFF(password: String) {
    return this.http.post(`${this.rootURL}/admin/FFAuth?key=${this.key}`, {
      password: password,
    });
  }
  validateOTP(otp: String) {
    this.http
      .post(`${this.rootURL}/admin/2FAuth?key=${this.key}`, {
        otp: otp,
      })
      .subscribe({
        next: (res: any) => {
          this.token = res.jwt.accessToken;
          this.refersh = res.jwt.refreshToken;
          this.isAuthenticated = true;
          this.authStatusListener$.next(true);
          sessionStorage.setItem('token', this.token);
          sessionStorage.setItem('refersh', this.refersh);
          this.sharedService.isLoading.next(false);
          this.router.navigate(['/dashboard/overview']);
        },
        error: (err) => {
          this.otpError$.next(true);
        },
      });
  }
  autoAuth() {
    const token = sessionStorage.getItem('token');
    const refersh = sessionStorage.getItem('refersh');
    if (!token || !refersh) {
      return;
    }
    this.token = token;
    this.refersh = refersh;
    this.isAuthenticated = true;
    this.authStatusListener$.next(true);
  }
  logout() {
    this.http
      .post(
        `${this.rootURL}/admin/logout?key=${this.key}`,
        {
          token: this.getRefersh(),
        },
        { responseType: 'text' }
      )
      .subscribe({
        next: () => {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refersh');
          this.token = '';
          this.refersh = '';
          this.isAuthenticated = false;
          this.authStatusListener$.next(false);
          this.sharedService.isLoading.next(false);
          this.router.navigate(['/signin']);
        },
        error: (err) => {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refersh');
          this.token = '';
          this.refersh = '';
          this.isAuthenticated = false;
          this.authStatusListener$.next(false);
          this.sharedService.isLoading.next(false);
          this.router.navigate(['/signin']);
        },
      });
  }
  removeAuthData() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refersh');
    this.token = '';
    this.refersh = '';
    this.isAuthenticated = false;
    this.authStatusListener$.next(false);
    this.sharedService.isLoading.next(false);
    this.router.navigate(['/signin']);
  }
}
