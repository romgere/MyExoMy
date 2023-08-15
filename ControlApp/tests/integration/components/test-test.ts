import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | test', function(hooks) {
  setupRenderingTest(hooks)

  test('it renders', async function(assert) {
   
    await render(hbs`<Test data-test-component />`)

    assert
      .dom('[data-test-component]')
      .exists('It renders ')
  })
})
