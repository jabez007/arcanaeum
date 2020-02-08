import { expect } from 'chai';
import { mount } from '@vue/test-utils';
import CaesarCipher from '@/views/CryptoTron/CaesarCipher.vue';
import '@/plugins/vuetify';

describe('CaesarCipher.vue', () => {
  it('updates the key when the example is clicked', (done) => {
    const wrapper = mount(CaesarCipher);
    wrapper.find('#example-1').element.click();
    wrapper.vm.$nextTick(() => {
      try {
        expect(wrapper.find('#key-shift').element.value).to.eq('13');
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
