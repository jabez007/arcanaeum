import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/vigenere";

describe("Vigenere Cipher", () => {
  const key = {
    keyword: "fortification"
  };
  const plaintext = "defend the east wall of the castle";
  const ciphertext = "iswxvi bje xigg boce wk bje viggqs";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
