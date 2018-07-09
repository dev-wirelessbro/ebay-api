const assert = require("assert");
const moment = require("moment");
const mock = require("./Mock").create();
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const toJson = require("xml2json").toJson;

const EbayClient = require("../lib/EbayClient");
const errors = require("../lib/Error");
const OAuthClientData = {
  token: "TOKENTOKENTOKEN",
  authType: "OAUTH",
  expire: moment().add(1, "day"),
  env: "sandbox"
};

const AuthNAuthClientData = {
  token: "TOKENTOKENTOKEN",
  authType: "AUTHNAUTH",
  expire: moment().add(1, "day"),
  env: "sandbox",
  appConfig: {
    clientId: "CLIENTIDTEST",
    devId: "DEVIDTEST",
    certId: "CERTIDTEST"
  }
};

describe("EbayClient", () => {
  afterEach(() => mock.reset());

  it("EbayClient should save env, token, authType, expire", () => {
    const ebayClient = new EbayClient(OAuthClientData);

    const keys = ["authType", "env", "expire", "token"];
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
    const ebayClient = new EbayClient({
      ...OAuthClientData,
      expire: moment().subtract(1, "day")
    });

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
      "X-EBAY-API-CALL-NAME": "GetSellerList",
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
      .then(result => {
        assert(postData.data);
        assert.deepEqual(
          _.pick(postData.headers, Object.keys(expectedHeaders)),
          expectedHeaders
        );
      });
  });

  it("getSellerList throw InvalidOptionsError when pass an invalid options", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    return ebayClient
      .getSellerList("invalid")
      .catch(error => error)
      .then(error => {
        assert.equal(error.name, errors.InvalidOptionsError.name);
      });
  });

  it("getSellerList is able to parse result correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;
    const sellerListSampleXML = fs
      .readFileSync(path.resolve(__dirname, "./getSellerListSample.xml"))
      .toString()
      .replace(/\n|\r/g, "");

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, sellerListSampleXML];
    });

    return ebayClient.getSellerList().then(result => {
      assert(result);
      assert(result.ItemArray.Item.length === 11);
    });
  });

  it("getSellerList is able to handle pagination correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;
    const pages = [1, 2, 3].map(number =>
      fs
        .readFileSync(
          path.resolve(
            __dirname,
            `./getSellerListSampleWithPagnination/${number}.xml`
          )
        )
        .toString()
    );

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      const pageInfo = /<PageNumber>(\d+)<\/PageNumber>/.exec(postConfig.data);
      if (pageInfo && pageInfo[1]) {
        return [200, pages[parseInt(pageInfo[1]) - 1]];
      }
      return [200, pages[0]];
    });

    return ebayClient.getSellerList().then(result => {
      assert.equal(result.ItemArray.Item.length, 11);
    });
  });

  it("getSellerOrder is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;
    const orderSampleXML = fs
      .readFileSync(path.resolve(__dirname, "./getOrdersSample.xml"))
      .toString()
      .replace(/\n|\r/g, "");

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, orderSampleXML];
    });
    const options = {
      CreateTimeFrom: "2018-03-07T23:10:24.540Z",
      CreateTimeTo: "2018-07-05T22:10:24.542Z"
    };
    const expectedPost = `<?xml version="1.0" encoding="utf-8" ?>
    <GetOrdersRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <WarningLevel>High</WarningLevel>
        <OrderRole>Seller</OrderRole>
        <OrderStatus>Completed</OrderStatus>
        <CreateTimeFrom>2018-03-07T23:10:24.540Z</CreateTimeFrom>
        <CreateTimeTo>2018-07-05T22:10:24.542Z</CreateTimeTo>
        <Pagination>
            <EntriesPerPage>100</EntriesPerPage>
            <PageNumber>1</PageNumber>
        </Pagination>
    </GetOrdersRequest>`;
    return ebayClient.getOrders(options).then(result => {
      assert.deepEqual(
        JSON.parse(toJson(postData.data)),
        JSON.parse(toJson(expectedPost))
      );
      assert(result);
      assert(result.OrderArray.Order.length === 13);
    });
  });

  it("getOrders is able to handle pagination correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;
    const pages = [1, 2, 3].map(number =>
      fs
        .readFileSync(
          path.resolve(__dirname, `./getOrdersPagination/${number}.xml`)
        )
        .toString()
    );

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      const pageInfo = /<PageNumber>(\d+)<\/PageNumber>/.exec(postConfig.data);
      if (pageInfo && pageInfo[1]) {
        return [200, pages[parseInt(pageInfo[1]) - 1]];
      }
      return [200, Page1];
    });

    return ebayClient.getOrders().then(result => {
      assert.equal(result.OrderArray.Order.length, 13);
    });
  });

  it("getUser is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;

    const getUserSampleXML = fs
      .readFileSync(path.resolve(__dirname, "./getUserSample.xml"))
      .toString();

    const expected = `<?xml version="1.0" encoding="utf-8" ?>
    <GetUserRequest xmlns="urn:ebay:apis:eBLBaseComponents">
	    <DetailLevel>ReturnAll</DetailLevel>
    </GetUserRequest>`;

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, getUserSampleXML];
    });

    return ebayClient.getUser().then(result => {
      assert.deepEqual(
        JSON.parse(toJson(postData.data)),
        JSON.parse(toJson(expected))
      );
      assert(result.User);
    });
  });

  it("compeleteSale is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;

    const completeSaleSample = fs
      .readFileSync(path.resolve(__dirname, "./completeSaleSample.xml"))
      .toString();

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, completeSaleSample];
    });

    const expected = `<?xml version="1.0" encoding="utf-8" ?>
    <CompleteSaleRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
      <OrderLineItemID>TESTTESTTEST10</OrderLineItemID>
      <Shipment>
        <ShipmentTrackingDetails>
          <ShipmentTrackingNumber>111111111111</ShipmentTrackingNumber>
          <ShippingCarrierUsed>USPS</ShippingCarrierUsed>
        </ShipmentTrackingDetails>
      </Shipment>
    </CompleteSaleRequest>`;

    const options = {
      OrderLineItemID: "TESTTESTTEST10",
      Shipment: {
        ShipmentTrackingDetails: {
          ShipmentTrackingNumber: "111111111111",
          ShippingCarrierUsed: "USPS"
        }
      }
    };

    return ebayClient.completeSale(options).then(result => {
      assert.deepEqual(
        JSON.parse(toJson(postData.data)),
        JSON.parse(toJson(expected))
      );
      assert(result.Ack);
    });
  });

  it("setNotification is able to post correctly", () => {
    const ebayClient = new EbayClient(AuthNAuthClientData);
    let postData;

    const setNotificationPreferenceSample = fs
      .readFileSync(
        path.resolve(__dirname, "./setNotificationPreferenceSample.xml")
      )
      .toString();

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, setNotificationPreferenceSample];
    });

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?>
    <SetNotificationPreferencesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
    <RequesterCredentials>
      <eBayAuthToken>TOKENTOKENTOKEN</eBayAuthToken>
    </RequesterCredentials>
    <ApplicationDeliveryPreferences>
    <ApplicationEnable>Enable</ApplicationEnable>
    <ApplicationURL>APPLICATIONURL</ApplicationURL>
    <DeliveryURLDetails>
        <DeliveryURL>DELIVERYURL</DeliveryURL>
        <DeliveryURLName>office</DeliveryURLName>
        <Status>Enable</Status>
    </DeliveryURLDetails>
    <DeviceType>Platform</DeviceType>
    <PayloadVersion>1057</PayloadVersion>
  </ApplicationDeliveryPreferences>
      <DeliveryURLName>office</DeliveryURLName>
      <UserDeliveryPreferenceArray>
       <NotificationEnable>
          <EventType>FixedPriceTransaction</EventType>
          <EventEnable>Enable</EventEnable>
        </NotificationEnable>
      </UserDeliveryPreferenceArray>
      <Version>1061</Version>
      <WarningLevel>High</WarningLevel>
    </SetNotificationPreferencesRequest>`;

    const options = {
      ApplicationDeliveryPreferences: {
        ApplicationEnable: "Enable",
        ApplicationURL: "APPLICATIONURL",
        DeliveryURLDetails: {
          DeliveryURL: "DELIVERYURL",
          DeliveryURLName: "office",
          Status: "Enable"
        },
        DeviceType: "Platform"
      },
      DeliveryURLName: "office",
      UserDeliveryPreferenceArray: {
        NotificationEnable: {
          EventType: "FixedPriceTransaction",
          EventEnable: "Enable"
        }
      }
    };

    return ebayClient.setNotificationPreferences(options).then(result => {
      assert.deepEqual(
        JSON.parse(toJson(postData.data)),
        JSON.parse(toJson(expectedPostData))
      );
      assert(result.Ack);
    });
  });

  it("when request expired token, it will throw ExpiredTokenError", () => {
    const config = {
      ...OAuthClientData,
      expire: moment().subtract(1, "day")
    };

    const ebayClient = new EbayClient(config);

    mock.onAny().reply(200);

    return ebayClient
      .getUser()
      .catch(error => error)
      .then(error => {
        assert.equal(error.name, errors.ExpiredTokenError.name);
      });
  });

  it("when the reply is Failure it should throw out error", () => {
    const config = {
      ...OAuthClientData,
      expire: moment().add(1, "day")
    };

    const ebayClient = new EbayClient(config);

    const errorData = `<?xml version="1.0" encoding="UTF-8"?>
    <GetSellerListResponse 
      xmlns="urn:ebay:apis:eBLBaseComponents">
      <Timestamp>2018-07-09T17:27:18.452Z</Timestamp>
      <Ack>Failure</Ack>
      <Errors>
        <ShortMessage>Input data is invalid.</ShortMessage>
        <LongMessage>Input data for tag &lt;StartTimeFrom&gt; is invalid or missing. Please check API documentation.</LongMessage>
        <ErrorCode>37</ErrorCode>
        <SeverityCode>Error</SeverityCode>
        <ErrorParameters ParamID="0">
          <Value>StartTimeFrom</Value>
        </ErrorParameters>
        <ErrorClassification>RequestError</ErrorClassification>
      </Errors>
      <Version>1023</Version>
      <Build>E1023_CORE_APISELLING_18580287_R1</Build>
    </GetSellerListResponse>`;
    mock.onAny().reply(200, errorData);

    return ebayClient
      .getUser()
      .catch(error => error)
      .then(error => {
        assert.equal(error.name, errors.RequestEbayError.name);
      });
  });
});
