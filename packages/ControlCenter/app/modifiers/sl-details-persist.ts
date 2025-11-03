import { SlDetails } from '@shoelace-style/shoelace';
import Modifier from 'ember-modifier';
import config from '@robot/control-center/config/environment';
import { action } from '@ember/object';

interface Signature {
  Element: SlDetails;
  Args: {
    Positional: [string, boolean | undefined];
  };
}

export default class SlDetailsPersistModifier extends Modifier<Signature> {
  private name: string = '';

  get storageKey() {
    return `${config.modulePrefix}-sidePanelSettings-${this.name}`;
  }

  modify(element: SlDetails, [name, defaultOpen = false]: [string, boolean | undefined]) {
    this.name = name;

    const storageVal = localStorage.getItem(this.storageKey);
    const sidePanelSettings = storageVal ? storageVal === 'true' : defaultOpen;

    if (sidePanelSettings) {
      element.setAttribute('open', '');
    } else {
      element.removeAttribute('open');
    }

    element.addEventListener('sl-after-show', this.persistOpen);
    element.addEventListener('sl-after-hide', this.persistClose);
  }

  @action
  persistOpen() {
    localStorage.setItem(this.storageKey, 'true');
  }
  @action
  persistClose() {
    localStorage.setItem(this.storageKey, 'false');
  }
}
