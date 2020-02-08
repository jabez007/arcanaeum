import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/caesar";

describe("Caesar Cipher", () => {
  const key = {
    shift: 5
  };
  const plaintext = "attack at dawn";
  const ciphertext = "fyyfhp fy ifbs";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
