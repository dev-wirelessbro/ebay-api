const assert = require("assert");
const Ebay = require("../lib/Ebay");
const _ = require("lodash");
const qs = require("qs");
const mock = require("./Mock").create();

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

describe("Ebay class", () => {
  afterEach(() => mock.reset());
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

  it("should use `production` as default env", () => {
    const config = {
      clientId: "TEST clientId",
      certId: "TEST certId",
      devId: "TEST devId",
      authType: "OAuth",
      redirectURI: "Wirelessbro-Wireless-wirele-jmdrv"
    };

    const ebay = new Ebay(config);

    assert.equal(ebay.config.env, "production")

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

    const config = {
      clientId: "Wireless-wireless-SBX-85d705b3d-529548a6",
      certId: "SBX-5d705b3d6c82-1c55-473a-8979-04be",
      authType: "OAuth",
      env: "sandbox",
      redirectURI: "TEST",
      scope
    };
    const ebay = new Ebay(config);
    let postData = {};

    mock.onAny().reply(postConfig => {
      postData = postConfig;
      return [200, successToken];
    });

    const code = "TestAuthorizationCodeReturnByEbay";
    return ebay
      .getOAuthToken(code)
      .catch(err => {})
      .then(result => {
        assert.deepEqual(
          _.pick(postData.headers, ["Content-Type", "Authorization"]),
          expectedHeaders
        );

        assert.equal(
          postData.data,
          qs.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: "TEST"
          })
        );

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

      assert.deepEqual(
        postData.data,
        qs.stringify({
          grant_type: "refresh_token",
          refresh_token,
          redirect_uri: "TEST"
        })
      );

      assert.deepEqual(result, successToken);
    });
  });

  it("GetSeesionId is able to get seesion Id", () => {
    const config = {
      clientId: "Wireless-wireless-SBX-85d705b3d-529548a6",
      certId: "SBX-5d705b3d6c82-1c55-473a-8979-04be",
      authType: "OAuth",
      env: "sandbox",
      redirectURI: "TEST",
      scope
    };
    mock
      .onPost("https://api.sandbox.ebay.com/identity/v1/oauth2/token")
      .reply(config => {
        postData = config;
        return [200, successToken];
      });
    const ebay = new Ebay(config);

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?>
    <GetSessionIDRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <!-- Call-specific Input Fields -->
      <RuName>${config.redirectURI}</RuName>
      <!-- Standard Input Fields -->
      <ErrorLanguage>en_US</ErrorLanguage>
      <Version>1057</Version>
      <WarningLevel>High</WarningLevel>
    </GetSessionIDRequest>`;
    const expectedPostHeaders = {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
      "X-EBAY-API-CALL-NAME": "GetSessionID",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-APP-NAME": config.clientId,
      "X-EBAY-API-DEV-NAME": config.devId,
      "X-EBAY-API-CERT-NAME": config.certId
    };

    let postData = {};
    let postHeaders = {};
    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig.data;
      postHeaders = postConfig.headers;
      const response = `<?xml version="1.0" encoding="UTF-8"?>
      <GetSessionIDResponse xmlns="urn:ebay:apis:eBLBaseComponents">
        <Timestamp>2015-11-10T01:31:34.148Z</Timestamp>
        <Ack>Success</Ack>
        <Version>967</Version>
        <Build>E967_CORE_BUNDLED_12301500_R1</Build>
        <SessionID>MySessionID</SessionID>
      </GetSessionIDResponse>`;
      return [200, response];
    });

    return ebay.getSessionId().then(sessionId => {
      assert.equal(sessionId, "MySessionID");
      assert.equal(postData, expectedPostData);
      assert.deepEqual(
        expectedPostHeaders,
        _.pick(postHeaders, _.keys(expectedPostHeaders))
      );
    });
  });

  it("GetEbayAuthNAuthToken is able to get token", () => {
    const config = {
      clientId: "Wireless-wireless-SBX-85d705b3d-529548a6",
      certId: "SBX-5d705b3d6c82-1c55-473a-8979-04be",
      authType: "AuthNAuth",
      env: "sandbox",
      redirectURI: "TEST",
      scope
    };
    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(config => {
      postData = config;
      return [200, successToken];
    });
    const ebay = new Ebay(config);

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?>
    <FetchTokenRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <SessionID>YourSessionIDHere</SessionID>
    </FetchTokenRequest>`;
    const expectedPostHeaders = {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
      "X-EBAY-API-CALL-NAME": "FetchToken",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-APP-NAME": config.clientId,
      "X-EBAY-API-DEV-NAME": config.devId,
      "X-EBAY-API-CERT-NAME": config.certId
    };

    let postData = {};
    let postHeaders = {};
    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig.data;
      postHeaders = postConfig.headers;
      const response = `<?xml version="1.0" encoding="utf-8"?>
      <FetchTokenResponse xmlns="urn:ebay:apis:eBLBaseComponents">
        <Timestamp>2015-11-10T20:42:58.943Z</Timestamp>
        <Ack>Success</Ack>
        <Version>967</Version>
        <Build>E967_CORE_BUNDLED_12301500_R1</Build>
        <eBayAuthToken>YourAuthToken</eBayAuthToken>
        <HardExpirationTime>2016-05-03T20:36:32.000Z</HardExpirationTime>
      </FetchTokenResponse> `;
      return [200, response];
    });

    return ebay
      .getAuthNAuthToken("YourSessionIDHere")
      .then(({ token, expire }) => {
        assert.equal(token, "YourAuthToken");
        assert.equal(expire, "2016-05-03T20:36:32.000Z");
        assert.deepEqual(
          expectedPostHeaders,
          _.pick(postHeaders, _.keys(expectedPostHeaders))
        );
        assert.equal(postData, expectedPostData);
      });
  });
});
