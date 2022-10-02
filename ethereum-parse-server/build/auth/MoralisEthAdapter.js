"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Note: do not import Parse dependency. see https://github.com/parse-community/parse-server/issues/6467
/* global Parse */
const moralis_1 = __importDefault(require("moralis"));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAuthData(authData) {
    const { signature, data } = authData;
    return moralis_1.default.Auth.verify({
        message: data,
        signature,
        network: 'evm',
    })
        .then((result) => {
        const authenticated = result.toJSON();
        authData.chainId = result.result.chain.decimal;
        authData.nonce = authenticated.nonce;
        authData.address = result.result.address.checksum;
        authData.version = authenticated.version;
        authData.domain = authenticated.domain;
        authData.expirationTime = authenticated.expirationTime;
        authData.notBefore = authenticated.notBefore;
        authData.resources = authenticated.resources;
        authData.statement = authenticated.statement;
        authData.uri = authenticated.uri;
        authData.moralisProfileId = authenticated.profileId;
    })
        .catch(() => {
        // @ts-ignore (see note at top of file)
        throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Moralis auth failed, invalid data');
    });
}
function validateAppId() {
    return Promise.resolve();
}
exports.default = {
    validateAuthData,
    validateAppId,
};
//# sourceMappingURL=MoralisEthAdapter.js.map