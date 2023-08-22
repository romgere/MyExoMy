import Component from '@glimmer/component';
import { service } from '@ember/service';
import type RoverSensorService from '@robot/control-center/services/rover-sensor';

interface SensorStatusArgs {}

export default class SensorStatus extends Component<SensorStatusArgs> {
  @service declare roverSensor: RoverSensorService;
}
