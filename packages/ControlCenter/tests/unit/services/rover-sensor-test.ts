import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | rover-sensor', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    const service = this.owner.lookup('service:rover-sensor');
    assert.ok(service);
  });
});
