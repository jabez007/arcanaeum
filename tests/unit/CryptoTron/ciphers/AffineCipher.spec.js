import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/affine";

describe("Affine Cipher", () => {
  const key = {
    alpha: 3,
    beta: 2
  };
  const plaintext = "defend the east wall of the castle";
  const ciphertext = "loropl hxo oceh qcjj sr hxo icehjo";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
