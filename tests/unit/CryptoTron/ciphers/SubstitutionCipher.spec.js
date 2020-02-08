import { expect } from "chai";
import { alphaLower } from "_/CryptoTron/ciphers";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/substitution";

describe("Substitution Cipher", () => {
  const key = {
    plainAlphabet: [...alphaLower],
    cipherAlphabet: [..."phqgiumeaylnofdxjkrcvstzwb"]
  };
  const plaintext = "defend the east wall of the castle";
  const ciphertext = "giuifg cei iprc tpnn du cei qprcni";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
