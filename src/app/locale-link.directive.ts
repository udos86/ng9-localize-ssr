import { Directive, HostBinding, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Directive({
  selector: 'a[localeLink],area[localeLink]'
})
export class LocaleLinkDirective implements OnChanges, OnDestroy {

  // tslint:disable-next-line:no-input-rename
  @Input('localeLink') locale: string;

  @HostBinding() href: string;

  private url: string;
  private subscription: Subscription;

  constructor(private router: Router) {
    this.subscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.url = event.url;
        this.updateHref();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateHref();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateHref() {
    this.href = this.getLocaleBaseUrl(this.locale, this.url);
  }

  private getLocaleBaseUrl(locale: string, url: string) {
    return `/${locale}${url}`;
  }
}
