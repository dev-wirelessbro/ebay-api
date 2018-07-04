const assert = require("assert");
const moment = require("moment");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const mock = new MockAdapter(axios);
const _ = require("lodash");

const EbayClient = require("../lib/EbayClient");
const errors = require("../lib/Error");
const OAuthClientData = {
  email: "testebay@wirelessbro.com",
  userId: "testebay00",
  token: "TOKENTOKENTOKEN",
  authType: "OAUTH",
  expire: "2018-07-01T01:31:34.148Z",
  env: "sandbox"
};

const AuthNAuthClientData = {
  email: "testebay@wirelessbro.com",
  userId: "testebay00",
  token: "TOKENTOKENTOKEN",
  authType: "AUTHNAUTH",
  expire: "2018-07-01T01:31:34.148Z",
  env: "sandbox",
  appConfig: {
    clientId: "CLIENTIDTEST",
    devId: "DEVIDTEST",
    certId: "CERTIDTEST"
  }
};

describe("EbayClient", () => {
  it("EbayClient should save email, env, userId, token, authType, expire", () => {
    const ebayClient = new EbayClient(OAuthClientData);

    const keys = ["authType", "email", "env", "expire", "token", "userId"];
    assert.deepEqual(_.pick(ebayClient.config, keys), OAuthClientData);
  });

  it("throw NoAuthTokenError when no token provided", () => {
    let error = null;
    try {
      const ebayClient = new EbayClient(_.omit(OAuthClientData, ["token"]));
    } catch (err) {
      error = err;
    } finally {
      assert.equal(error.name, errors.NoAuthTokenError.name);
    }
  });

  it("throw InvalidAuthNAuthConfigError when the authType is AuthNAuth but no appConfig provided", () => {
    let error = null;
    try {
      const ebayClient = new EbayClient(
        _.omit(AuthNAuthClientData, ["appConfig"])
      );
    } catch (err) {
      error = err;
    } finally {
      assert.equal(error.name, errors.InvalidAuthNAuthConfigError.name);
    }
  });

  it("throw NotSupportedAuthTypeError when the authType is invalid", () => {
    let error = null;
    try {
      const ebayClient = new EbayClient({
        ...OAuthClientData,
        authType: "FAKE"
      });
    } catch (err) {
      error = err;
    } finally {
      assert.equal(error.name, errors.NotSupportedAuthTypeError.name);
    }
  });

  it("is expire determine expire correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);

    assert.equal(ebayClient.isExpire, true);
  });

  it("is expire determine not expire correctly", () => {
    const ebayClient = new EbayClient({
      ...OAuthClientData,
      expire: moment().add(1, "hour")
    });

    assert.equal(ebayClient.isExpire, false);
  });

  it("determine url according to the env", () => {
    const sandboxClient = new EbayClient({
      ...OAuthClientData,
      env: "sandbox"
    });

    const productionClient = new EbayClient({
      ...OAuthClientData,
      env: "production"
    });

    assert.equal(sandboxClient.url, "https://api.sandbox.ebay.com/ws/api.dll");
    assert.equal(productionClient.url, "https://api.ebay.com/ws/api.dll");
  });

  it("set OAuth headers correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    const expectedHeaders = {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-IAF-TOKEN": "Bearer " + OAuthClientData.token
    };
    assert.deepEqual(ebayClient.headers, expectedHeaders);
  });

  it("set AuthNAuth headers correctly", () => {
    const ebayClient = new EbayClient(AuthNAuthClientData);
    const expectedHeaders = {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-APP-NAME": AuthNAuthClientData.appConfig.clientId,
      "X-EBAY-API-DEV-NAME": AuthNAuthClientData.appConfig.devId,
      "X-EBAY-API-CERT-NAME": AuthNAuthClientData.appConfig.certId
    };
    assert.deepEqual(ebayClient.headers, expectedHeaders);
  });

  it("getSellerList is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    const expectedHeaders = {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
      "X-EBAY-API-CALL-NAME": "GetSellerListRequest",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-IAF-TOKEN": "Bearer " + OAuthClientData.token
    };

    let postData = {};
    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200];
    });

    return ebayClient
      .getSellerList()
      .catch(() => {})
      .then(() => {
        assert(postData.data);
        assert.deepEqual(
          _.pick(postData.headers, Object.keys(expectedHeaders)),
          expectedHeaders
        );
      });
  });

  it("getSellerList throw InvalidOptionsError when pass an invalid options", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let caughtError;
    try {
      ebayClient.getSellerList("invalid");
    } catch (err) {
      caughtError = err;
    } finally {
      assert.equal(caughtError.name, errors.InvalidOptionsError.name);
    }
  });

  it("getSellerList is able to parse result correctly");
  it("getSellerList is able to handle pagination correctly");
});
