import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | control', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:control');
    assert.ok(route);
  });
});
