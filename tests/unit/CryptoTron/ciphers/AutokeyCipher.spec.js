import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/autokey";

describe("Autokey Cipher", () => {
  const key = {
    primer: "fortification"
  };
  const plaintext = "defend the east wall of the castle";
  const ciphertext = "iswxvi bje xigg zeqp bi moi gakmhe";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
