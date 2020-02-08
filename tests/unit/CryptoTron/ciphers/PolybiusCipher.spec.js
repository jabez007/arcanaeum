import { expect } from "chai";
import { square, encrypt, decrypt } from "_/CryptoTron/ciphers/polybius";

describe("Polybius Square Cipher", () => {
  const key = {
    square: square("phqgiumeaylnofdxkrcvstzwb"),
    cipherChars: "ABCDE"
  };
  const plaintext = "defend the east wall of the castle";
  const ciphertext =
    "CEBCCDBCCBCE EBABBC BCBDEAEB EDBDCACA CCCD EBABBC DDBDEAEBCABC";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
