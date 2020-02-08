import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/columnarTransposition";

describe("Columnar Transposition Cipher", () => {
  const key = {
    keyword: "zebra"
  };
  const plaintext = "attackatdawn";
  const ciphertext = "catttanadakw";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
