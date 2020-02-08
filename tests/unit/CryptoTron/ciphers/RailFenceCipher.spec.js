import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/railFence";

describe("Rail-Fence Cipher", () => {
  const key = {
    rails: 3
  };
  const plaintext = "attackatdawn";
  const ciphertext = "acdtaktantaw";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
