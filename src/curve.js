
'use strict';

const curveJs = require('curve25519-js');
const nodeCrypto = require('crypto');

const PUBLIC_KEY_DER_PREFIX = Buffer.from([48, 42, 48, 5, 6, 3, 43, 101, 110, 3, 33, 0]);
const PRIVATE_KEY_DER_PREFIX = Buffer.from([48, 46, 2, 1, 0, 48, 5, 6, 3, 43, 101, 110, 4, 34, 4, 32]);

function validatePrivKey(privKey) {
    if (!privKey) throw new Error("Undefined private key");
    if (!(privKey instanceof Buffer)) throw new Error(`Invalid private key type: ${privKey.constructor.name}`);
    if (privKey.byteLength != 32) throw new Error(`Incorrect private key length: ${privKey.byteLength}`);
}

function scrubPubKeyFormat(pubKey) {
    if (!pubKey || (!(pubKey instanceof Buffer) || ((pubKey.byteLength != 33 || pubKey[0] != 5) && pubKey.byteLength != 32))) {
        throw new Error("Invalid public key");
    }
    return pubKey.byteLength == 33 ? pubKey.slice(1) : pubKey;
}

exports.generateKeyPair = function () {
    if (typeof nodeCrypto.generateKeyPairSync === 'function') {
        const { publicKey: publicDerBytes, privateKey: privateDerBytes } = nodeCrypto.generateKeyPairSync(
            'x25519',
            {
                publicKeyEncoding: { format: 'der', type: 'spki' },
                privateKeyEncoding: { format: 'der', type: 'pkcs8' }
            }
        );
        return {
            pubKey: Buffer.concat([Buffer.from([5]), publicDerBytes.slice(PUBLIC_KEY_DER_PREFIX.length)]),
            privKey: privateDerBytes.slice(PRIVATE_KEY_DER_PREFIX.length)
        };
    } else {
        const keyPair = curveJs.generateKeyPair(nodeCrypto.randomBytes(32));
        return {
            privKey: Buffer.from(keyPair.private),
            pubKey: Buffer.from(keyPair.public),
        };
    }
};

exports.calculateAgreement = function (pubKey, privKey) {
    pubKey = scrubPubKeyFormat(pubKey);
    validatePrivKey(privKey);

    if (typeof nodeCrypto.diffieHellman === 'function') {
        const nodePrivateKey = nodeCrypto.createPrivateKey({
            key: Buffer.concat([PRIVATE_KEY_DER_PREFIX, privKey]),
            format: 'der',
            type: 'pkcs8'
        });
        const nodePublicKey = nodeCrypto.createPublicKey({
            key: Buffer.concat([PUBLIC_KEY_DER_PREFIX, pubKey]),
            format: 'der',
            type: 'spki'
        });

        return nodeCrypto.diffieHellman({
            privateKey: nodePrivateKey,
            publicKey: nodePublicKey,
        });
    } else {
        return Buffer.from(curveJs.sharedKey(privKey, pubKey));
    }
};

exports.calculateSignature = function (privKey, message) {
    validatePrivKey(privKey);
    if (!message) throw new Error("Invalid message");
    return Buffer.from(curveJs.sign(privKey, message));
};

exports.verifySignature = function (pubKey, msg, sig) {
    pubKey = scrubPubKeyFormat(pubKey);
    if (!msg) throw new Error("Invalid message");
    if (!sig || sig.byteLength != 64) throw new Error("Invalid signature");
    return curveJs.verify(pubKey, msg, sig);
};