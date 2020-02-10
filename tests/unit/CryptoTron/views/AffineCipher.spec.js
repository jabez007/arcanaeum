import { expect } from "chai";
import { mount } from "@vue/test-utils";
import AffineCipher from "@/views/CryptoTron/AffineCipher.vue";
import "@/plugins/vuetify";

describe("AffineCipher.vue", () => {
  it("updates the key when the example is clicked", done => {
    const wrapper = mount(AffineCipher);
    wrapper.find("#example-1").element.click();
    wrapper.vm.$nextTick(() => {
      try {
        expect(wrapper.find("#key-alpha").element.value).to.eq("25");
        expect(wrapper.find("#key-beta").element.value).to.eq("25");
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
