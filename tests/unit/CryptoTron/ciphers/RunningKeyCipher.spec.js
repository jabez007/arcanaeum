import { expect } from "chai";
import { encrypt, decrypt } from "_/CryptoTron/ciphers/runningKey";

describe("Running Key Cipher", () => {
  const key = {
    keyText: "How does the duck know that? said Victor"
  };
  const plaintext = "defend the east wall of the castle";
  const ciphertext = "ksbhbh lal idmv gkyz ky ahx uaawgm";

  it("Encrypts a message", () => {
    expect(encrypt(key)(plaintext)).to.eq(ciphertext);
  });

  it("Decrypts a message", () => {
    expect(decrypt(key)(ciphertext)).to.eq(plaintext);
  });
});
