const KJUR = require('jsrsasign');
const crypto = require('crypto');

function generateKeyPair() {
  const rsaKeypair = KJUR.KEYUTIL.generateKeypair('RSA', 2048);
  return {
    privateKey: KJUR.KEYUTIL.getPEM(rsaKeypair.prvKeyObj, 'PKCS8PRV'),
    publicKey: KJUR.KEYUTIL.getPEM(rsaKeypair.pubKeyObj)
  };
}

// Create digital signature
function createSignature(data, privateKeyPEM) {
  try {
    // Hash the data
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    // Sign with private key
    const sig = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' });
    sig.init(privateKeyPEM);
    sig.updateString(data);
    const signature = sig.sign();
    
    return {
      hash: hash,
      signature: signature,
      algorithm: 'SHA256withRSA'
    };
  } catch (error) {
    throw new Error('Signature creation failed: ' + error.message);
  }
}

function verifySignature(data, signature, publicKeyPEM) {
  try {
    const sig = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' });
    sig.init(publicKeyPEM);
    sig.updateString(data);
    return sig.verify(signature);
  } catch (error) {
    return false;
  }
}

module.exports = {
  generateKeyPair,
  createSignature,
  verifySignature
};
