const assert = require("assert");
const Ebay = require("../lib/Ebay");
const _ = require("lodash");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const mock = new MockAdapter(axios);
const scope = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.marketing",
  "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
  "https://api.ebay.com/oauth/api_scope/sell.analytics.readonly"
];

describe("Ebay class init", () => {
  it("should save clientId, certId, devId, authType ans env", () => {
    const config = {
      clientId: "TEST clientId",
      certId: "TEST certId",
      devId: "TEST devId",
      authType: "OAuth",
      env: "sandbox",
      redirectURI: "Wirelessbro-Wireless-wirele-jmdrv"
    };

    const ebay = new Ebay(config);

    assert.deepEqual(
      _.pick(ebay.config, [
        "env",
        "clientId",
        "certId",
        "devId",
        "authType",
        "redirectURI"
      ]),
      config
    );
  });

  it("save oauth scope successfully", () => {
    const modifiedScope = Object.assign([], scope);
    const config = {
      clientId: "TEST clientId",
      certId: "TEST certId",
      devId: "TEST devId",
      authType: "OAuth",
      env: "sandbox",
      scope: modifiedScope
    };
    const ebay = new Ebay(config);

    modifiedScope[0] = null;
    assert.deepEqual(ebay.config.scope, scope);
  });

  it("calculate the OAuth credential correctly", () => {
    const config = {
      clientId: "Wireless-wireless-SBX-85d705b3d-529548a6",
      certId: "SBX-5d705b3d6c82-1c55-473a-8979-04be",
      authType: "OAuth",
      env: "sandbox"
    };

    const ebay = new Ebay(config);

    assert.equal(
      ebay.config.credential,
      "Basic V2lyZWxlc3Mtd2lyZWxlc3MtU0JYLTg1ZDcwNWIzZC01Mjk1NDhhNjpTQlgtNWQ3MDViM2Q2YzgyLTFjNTUtNDczYS04OTc5LTA0YmU="
    );
  });

  it("determine sandbox url correctly", () => {
    const config = {
      env: "sandbox"
    };

    const ebay = new Ebay(config);

    assert.equal(ebay.url, "https://api.sandbox.ebay.com/");
  });

  it("determine production url correctly", () => {
    const config = {
      env: "production"
    };

    const ebay = new Ebay(config);

    assert.equal(ebay.url, "https://api.ebay.com/");
  });

  it("getOAuthToken is able to post correctly", () => {
    const successToken = {
      access_token: "v^1.1#i^1#p^3#r^1XzMjRV4xMjg0",
      expires_in: 7200,
      refresh_token: "v^1.1#i^1#p^3#r^1zYjRV4xMjg0",
      refresh_token_expires_in: 47304000,
      token_type: "User Access Token"
    };

    const expectedHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic V2lyZWxlc3Mtd2lyZWxlc3MtU0JYLTg1ZDcwNWIzZC01Mjk1NDhhNjpTQlgtNWQ3MDViM2Q2YzgyLTFjNTUtNDczYS04OTc5LTA0YmU="
    };

    let postData = {};

    mock
      .onPost("https://api.sandbox.ebay.com/identity/v1/oauth2/token")
      .reply(config => {
        postData = config;
        return [200, successToken];
      });

    const config = {
      clientId: "Wireless-wireless-SBX-85d705b3d-529548a6",
      certId: "SBX-5d705b3d6c82-1c55-473a-8979-04be",
      authType: "OAuth",
      env: "sandbox",
      redirectURI: "TEST",
      scope
    };

    const ebay = new Ebay(config);
    const code = "TestAuthorizationCodeReturnByEbay";
    return ebay.getOAuthToken(code).then(result => {
      assert.deepEqual(
        _.pick(postData.headers, ["Content-Type", "Authorization"]),
        expectedHeaders
      );

      assert.deepEqual(JSON.parse(postData.data), {
        grant_type: "authorization_code",
        code,
        redirect_uri: "TEST"
      })

      assert.deepEqual(result, successToken);
    });
  });


  it("getRefreshToken is able to post correctly", () => {
    const successToken = {
      access_token: "v^1.1#i^1#p^3#r^1XzMjRV4xMjg0",
      expires_in: 7200,
      refresh_token: "v^1.1#i^1#p^3#r^1zYjRV4xMjg0",
      refresh_token_expires_in: 47304000,
      token_type: "User Access Token"
    };

    const expectedHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic V2lyZWxlc3Mtd2lyZWxlc3MtU0JYLTg1ZDcwNWIzZC01Mjk1NDhhNjpTQlgtNWQ3MDViM2Q2YzgyLTFjNTUtNDczYS04OTc5LTA0YmU="
    };

    let postData = {};

    mock
      .onPost("https://api.sandbox.ebay.com/identity/v1/oauth2/token")
      .reply(config => {
        postData = config;
        return [200, successToken];
      });

    const config = {
      clientId: "Wireless-wireless-SBX-85d705b3d-529548a6",
      certId: "SBX-5d705b3d6c82-1c55-473a-8979-04be",
      authType: "OAuth",
      env: "sandbox",
      redirectURI: "TEST",
      scope
    };

    const ebay = new Ebay(config);
    const refresh_token = "RefreshTokenStored";
    return ebay.getRefreshToken(refresh_token).then(result => {
      assert.deepEqual(
        _.pick(postData.headers, ["Content-Type", "Authorization"]),
        expectedHeaders
      );

      assert.deepEqual(JSON.parse(postData.data), {
        grant_type: "refresh_token",
        refresh_token,
        redirect_uri: "TEST"
      })

      assert.deepEqual(result, successToken);
    });
  })
});
