import { expect } from 'chai';
import { encrypt, decrypt } from '_/CryptoTron/ciphers/caesar';

describe('Caesar Cipher', () => {
  it('Encrypts a message', () => {
    expect(encrypt({ shift: 5 })('attack at dawn')).to.eq('fyyfhp fy ifbs');
  });

  it('Decrypts a message', () => {
    expect(decrypt({ shift: 5 })('fyyfhp fy ifbs')).to.eq('attack at dawn');
  });
});
