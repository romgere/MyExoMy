import Component from '@glimmer/component';
import { service } from '@ember/service';
import L from 'leaflet';
import { modifier } from 'ember-modifier';
import type RoverSensorService from '@robot/control-center/services/rover-sensor';
import { action } from '@ember/object';

interface Args {}

export default class ConnectionStatusComponent extends Component<Args> {
  @service declare roverSensor: RoverSensorService;

  private map?: L.Map;
  private marker?: L.Marker;

  initMap = modifier((element: HTMLDivElement) => {
    if (!this.map) {
      this.map = L.map(element).setView(
        [this.roverSensor.latitude[0], this.roverSensor.longitude[0]],
        18,
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
      this.marker = L.marker([this.roverSensor.latitude[0], this.roverSensor.longitude[0]]);
      this.marker.addTo(this.map);
    } else {
      this.map.setView([this.roverSensor.latitude[0], this.roverSensor.longitude[0]]);
      this.marker?.setLatLng([this.roverSensor.latitude[0], this.roverSensor.longitude[0]]);
    }
  });

  @action
  handleResize() {
    // Fake a window "resize" event if map container is resize.
    // this is needed as leaflet only lister to window resize event
    window.dispatchEvent(new Event('resize'));
  }

  get qualityIcon() {
    switch (this.roverSensor.quality) {
      case 1:
        return 'reception-1';
      case 2:
        return 'reception-2';
      case 3:
        return 'reception-3';
      case 4:
        return 'reception-4';
      default:
        return 'reception-0';
    }
  }

  get qualityLabel() {
    switch (this.roverSensor.quality) {
      case 1:
        return 'Uncorrected coordinate';
      case 2:
        return 'Differentially correct coordinate (e.g., WAAS, DGPS)';
      case 4:
        return 'RTK Fix coordinate (centimeter precision)';
      case 5:
        return 'RTK Float (decimeter precision';
    }

    return 'Unknow';
  }

  get statusIcon() {
    return this.roverSensor.status === 'A' ? 'check' : 'x-lg';
  }

  get statusVariant() {
    return this.roverSensor.status === 'A' ? 'success' : 'danger';
  }

  get statusLabel() {
    return this.roverSensor.status === 'A' ? 'Valid position' : 'Invalid position';
  }
}
