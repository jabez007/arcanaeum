import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import CaesarCipher from '@/views/CryptoTron/CaesarCipher.vue';

describe('CaesarCipher.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message';
    const wrapper = shallowMount(CaesarCipher, {
      propsData: { msg },
    });
    expect(wrapper.text()).to.include(msg);
  });
});
