import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/fourSquare";
import { square } from "_/CryptoTron/ciphers/polybius";

describe("Four Square Cipher", () => {
  const key = {
    plainSquare: square(""),
    upperCipherSquare: square("zgptfoihmuwdrcnykeqaxvsbl"),
    lowerCipherSquare: square("mfnbdcrhsaxyogvituewlqzkp")
  };
  const plaintext = "attack at dawn";
  const ciphertext = "TIYBFH TI ZBSY".toLowerCase();

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
