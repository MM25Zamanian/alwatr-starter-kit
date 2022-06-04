import {router} from '@alwatr/router';
import {SignalInterface} from '@alwatr/signal';
import {css, html, nothing} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';
import {state} from 'lit/decorators/state.js';
import {classMap} from 'lit/directives/class-map.js';

import {AppElement} from './app-debt/app-element';
import {mainNavigation} from './config';

import './pages/page-home';
import './pages/page-about';

import type {RoutesConfig} from '@alwatr/router';
import type {ListenerInterface} from '@alwatr/signal';
import type {TemplateResult} from 'lit';

declare global {
  interface HTMLElementTagNameMap {
    'app-index': AppIndex;
  }
}

/**
 * APP PWA Root Element
 *
 * ```html
 * <app-index></app-index>
 * ```
 */
@customElement('app-index')
export class AppIndex extends AppElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }

    .page-container {
      position: relative;
      flex-grow: 1;
      flex-shrink: 1;
      flex-basis: 0%;
    }

    nav {
      display: flex;
      padding: 12px 16px;
      background-color: #333;
    }

    nav .nav__item {
      padding: 8px;
      color: #fff;
      transition: color 256ms ease, background-color 256ms ease;
      border-radius: 4px;
      text-decoration:none;
    }

    nav .nav__item.active {
      transition: color 256ms 128ms ease, background-color 256ms 128ms ease;
      background-color: #fff;
      color: #000;
    }
  `;

  constructor() {
    super();
    router.initial();
  }

  @state()
  protected _hideNavigation = true;

  protected _hideNavigationSignal = new SignalInterface('hide-navigation');

  protected _activePage = 'home';

  protected _routes: RoutesConfig = {
    // TODO: refactor route, we need to get active page!
    // TODO: ability to redirect!
    map: (route) => (this._activePage = route.sectionList[0]?.toString().trim() || 'home'),
    list: {
      home: {
        render: () => html`<page-home></page-home>`,
      },
      about: {
        render: () => html`<page-about></page-about>`,
      },
    },
  };

  protected _listenerList: Array<unknown> = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this._listenerList.push(
        router.signal.addListener(
            (route) => {
              this._logger.logMethodArgs('routeChanged', {route});
              this._activePage = route.sectionList[0]?.toString().trim() || 'home';
              this.requestUpdate();
            },
            {receivePrevious: true},
        ),
        this._hideNavigationSignal.addListener((_hideNavigation) => {
          this._hideNavigation = _hideNavigation;
        }),
    );
    this._hideNavigationSignal.dispatch(false); // @TODO: make signal file and base config
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._listenerList.forEach((listener) => (listener as ListenerInterface<keyof AlwatrSignals>).remove());
  }

  override render(): TemplateResult {
    return html`
      ${this._renderNavigation()}
      <main class="page-container">${router.outlet(this._routes)}</main>
    `;
  }

  protected _renderNavigation(): TemplateResult | typeof nothing {
    if (this._hideNavigation) return nothing;

    const listTemplate = mainNavigation.map((item) => {
      const selected = this._activePage === item.id;
      return html`
        <a href="${router.makeUrl({sectionList: [item.id]})}" class="nav__item ${classMap({active: selected})}">
          <span class="nav__item-text">${item.title}</span>
        </a>
      `;
    });

    return html`<nav>${listTemplate}</nav>`;
  }
}
