import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/beaufort";

describe("Beaufort Cipher", () => {
  const key = {
    keyword: "fortification"
  };
  const plaintext = "defend the east wall of the castle";
  const ciphertext = "ckmpvc pvw piwu jogi ua pvw riwuuk";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
