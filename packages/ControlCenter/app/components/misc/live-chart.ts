import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import Chart, { PointStyle } from 'chart.js/auto';
import { throttle } from '@ember/runloop';
import { action } from '@ember/object';

interface LiveChartArgs {
  value: number;
  min?: number;
  max?: number;
  time?: number; // Interval (second) new value is inserted into the graph
  maxTime: number; // Max display time
}

interface UpdateValueSignature {
  Element: HTMLCanvasElement;
  Args: {
    Positional: [number];
  };
}

const lineColor = window.getComputedStyle(document.body).getPropertyValue('--sl-color-primary-600');

export default class LiveChart extends Component<LiveChartArgs> {
  chart?: Chart;

  get tooltip() {
    return `Last ${this.args.maxTime} seconds`;
  }

  mountChart = modifier((element: HTMLCanvasElement) => {
    const context = element.getContext('2d');

    if (!context) {
      return;
    }

    const data = {
      datasets: [
        {
          data: [],
          borderColor: lineColor,
          borderWidth: 4,
          pointStyle: false as PointStyle,
          tension: 0.1,
        },
      ],
      labels: [],
    };

    this.chart = new Chart(context, {
      type: 'line',
      data: data,
      options: {
        layout: {
          padding: 0,
        },
        scales: {
          x: { display: false },
          y: {
            display: false,
            min: this.args.min ?? undefined,
            max: this.args.max ?? undefined,
          },
        },
        plugins: {
          title: { display: false },
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: false,
        responsive: false,
        maintainAspectRatio: false,
      },
    });
  });

  updateValue = modifier<UpdateValueSignature>((_element: HTMLCanvasElement, [value]) => {
    // First value, insert 2 values immediatly to get the chart rendered with something
    if (value && this.chart?.data.datasets[0].data.length === 0) {
      this.addNewValue(value);
      this.addNewValue(value);
    } else if (value) {
      throttle(this, this.addNewValue, value, (this.args.time ?? 5) * 1000);
    }
  });

  @action
  addNewValue(value: number) {
    if (!this.chart) {
      return;
    }
    const { data } = this.chart;
    data.labels?.push(new Date().getTime());

    data.datasets[0].data.push(value);

    if (this.args.maxTime) {
      const maxCount = Math.ceil(this.args.maxTime / (this.args.time ?? 5)) + 2;
      const toDelete = (data.labels?.length ?? 0) - maxCount;

      if (toDelete > 0) {
        console.log('Remove', toDelete);
        data.labels?.splice(0, toDelete);
        data.datasets[0].data.splice(0, toDelete);
      }
    }

    this.chart.update();
  }
}
