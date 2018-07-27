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

  it("updateToken should be about to update OAuth headers", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    const oldHeaders = Object.assign({}, ebayClient.headers);
    ebayClient.updateToken("THENEWTOKENTHATISNOTTHEOLDONE");
    const newHeaders = Object.assign({}, ebayClient.headers);
    assert.notDeepEqual(oldHeaders, newHeaders);
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
      const ebayClient = new EbayClient(
        Object.assign({}, OAuthClientData, {
          authType: "FAKE"
        })
      );
    } catch (err) {
      error = err;
    } finally {
      assert.equal(error.name, errors.NotSupportedAuthTypeError.name);
    }
  });

  it("is expire determine expire correctly", () => {
    const ebayClient = new EbayClient(
      Object.assign({}, OAuthClientData, {
        expire: moment().subtract(1, "day")
      })
    );

    assert.equal(ebayClient.isExpire, true);
  });

  it("is expire determine not expire correctly", () => {
    const ebayClient = new EbayClient(
      Object.assign({}, OAuthClientData, {
        expire: moment().add(1, "hour")
      })
    );

    assert.equal(ebayClient.isExpire, false);
  });

  it("determine url according to the env", () => {
    const sandboxClient = new EbayClient(
      Object.assign({}, OAuthClientData, {
        env: "sandbox"
      })
    );

    const productionClient = new EbayClient(
      Object.assign({}, OAuthClientData, {
        env: "production"
      })
    );

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
      assert(result.ItemArray.Item.length === 20);
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

  it("GetSellerList is able to handle response with only one product correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;
    const sellerListSampleXML = fs
      .readFileSync(path.resolve(__dirname, "./getSellerListSingle.xml"))
      .toString()
      .replace(/\n|\r/g, "");

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, sellerListSampleXML];
    });

    return ebayClient.getSellerList().then(result => {
      assert(result);
      assert.equal(result.ItemArray.Item.length, 1);
      assert(Array.isArray(result.ItemArray.Item));
    });
  });

  it("GetSellerList is able to handle response with only one variation and only one value correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;
    const sellerListSampleXML = fs
      .readFileSync(path.resolve(__dirname, "./getSellerListSingle.xml"))
      .toString()
      .replace(/\n|\r/g, "");

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, sellerListSampleXML];
    });

    return ebayClient.getSellerList().then(result => {
      assert(result);
      assert.equal(result.ItemArray.Item.length, 1);
      assert(Array.isArray(result.ItemArray.Item[0].Variations.Variation));
      assert(Array.isArray(result.ItemArray.Item[0].PictureDetails));
      assert(
        Array.isArray(
          result.ItemArray.Item[0].Variations.Variation[0].VariationSpecifics
            .NameValueList
        )
      );
      assert(
        Array.isArray(
          result.ItemArray.Item[0].Variations.Variation[0].VariationSpecifics
            .NameValueList[0].Value
        )
      );
    });
  });

  it("getSellerOrder is able to post / parse correctly", () => {
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
      assert(Array.isArray(result.OrderArray.Order));
      assert(
        result.OrderArray.Order.every(o =>
          Array.isArray(o.TransactionArray.Transaction)
        )
      );
      assert(
        result.OrderArray.Order.every(o =>
          o.TransactionArray.Transaction.every(tr => {
            return !tr.Variation || !Array.isArray(tr.Variation);
          })
        )
      );
      assert(
        result.OrderArray.Order.every(o =>
          o.TransactionArray.Transaction.every(tr => {
            return (
              !tr.Variation ||
              Array.isArray(tr.Variation.VariationSpecifics.NameValueList)
            );
          })
        )
      );
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
    const config = Object.assign({}, OAuthClientData, {
      expire: moment().subtract(1, "day")
    });

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
    const config = Object.assign({}, OAuthClientData, {
      expire: moment().add(1, "day")
    });

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

  it("when the reply is Warning it should not throw out error", () => {
    const config = Object.assign({}, OAuthClientData, {
      expire: moment().add(1, "day")
    });

    const ebayClient = new EbayClient(config);

    const errorData = `<?xml version="1.0" encoding="UTF-8"?>
    <GetSellerListResponse 
      xmlns="urn:ebay:apis:eBLBaseComponents">
      <Timestamp>2018-07-09T17:27:18.452Z</Timestamp>
      <Ack>Warning</Ack>
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
      .then(() => {})
      .catch(error => error)
      .then(error => {
        assert(_.isEmpty(error))
      });
  });

  it("RequestEbayError should handle error arrays", () => {
    const config = Object.assign({}, OAuthClientData, {
      expire: moment().add(1, "day")
    });

    const ebayClient = new EbayClient(config);

    const errorData = `<?xml version="1.0" encoding="UTF-8"?>
    <GetSellerListResponse 
      xmlns="urn:ebay:apis:eBLBaseComponents">
      <Timestamp>2018-07-09T17:27:18.452Z</Timestamp>
      <Ack>Failure</Ack>
      <Errors>
        <ShortMessage>Input data is invalid.</ShortMessage>
        <LongMessage>1</LongMessage>
        <ErrorCode>37</ErrorCode>
        <SeverityCode>Error</SeverityCode>
        <ErrorParameters ParamID="0">
          <Value>StartTimeFrom</Value>
        </ErrorParameters>
        <ErrorClassification>RequestError</ErrorClassification>
      </Errors>
      <Errors>
        <ShortMessage>Input headers is invalid.</ShortMessage>
        <LongMessage>2</LongMessage>
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
        assert.equal("The reply from ebay is failure 1,2", error.message);
      });
  });

  it("addFixedPriceItem is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;

    const setNotificationPreferenceSample = fs
      .readFileSync(path.resolve(__dirname, "./addFixedPriceItemSample.xml"))
      .toString();

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, setNotificationPreferenceSample];
    });

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?>
    <AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
      <Item>
        <Title>Apple MacBook Pro MB990LL/A 13.3 in. Notebook NEW</Title>
        <Description>Brand New Apple MacBook Pro MB990LL/A 13.3 in. Notebook!</Description>
        <StartPrice>500.0</StartPrice>
        <ConditionID>1000</ConditionID>
        <Country>US</Country>
        <Currency>USD</Currency>
        <DispatchTimeMax>3</DispatchTimeMax>
        <ListingDuration>Days_7</ListingDuration>
        <ListingType>FixedPriceItem</ListingType>
        <PaymentMethods>PayPal</PaymentMethods>
        <PayPalEmailAddress>megaonlinemerchant@gmail.com</PayPalEmailAddress>
        <PictureDetails>
          <PictureURL>http://i12.ebayimg.com/03/i/04/8a/5f/a1_1_sbl.JPG</PictureURL>
          <PictureURL>http://i22.ebayimg.com/01/i/04/8e/53/69_1_sbl.JPG</PictureURL>
          <PictureURL>http://i4.ebayimg.ebay.com/01/i/000/77/3c/d88f_1_sbl.JPG</PictureURL>
        </PictureDetails>
        <ProductListingDetails>
          <UPC>885909298594</UPC>
          <IncludeStockPhotoURL>true</IncludeStockPhotoURL>
          <IncludeeBayProductDetails>true</IncludeeBayProductDetails>
          <UseFirstProduct>true</UseFirstProduct>
          <UseStockPhotoURLAsGallery>true</UseStockPhotoURLAsGallery>
          <ReturnSearchResultOnDuplicates>true</ReturnSearchResultOnDuplicates>
        </ProductListingDetails>
        <Quantity>6</Quantity>
        <ReturnPolicy>
          <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
          <RefundOption>MoneyBack</RefundOption>
          <ReturnsWithinOption>Days_30</ReturnsWithinOption>
          <Description>If you are not satisfied, return the item for refund.</Description>
          <ShippingCostPaidByOption>Buyer</ShippingCostPaidByOption>
        </ReturnPolicy>
        <ShippingDetails>
          <ShippingType>Flat</ShippingType>
          <ShippingServiceOptions>
            <ShippingServicePriority>1</ShippingServicePriority>
            <ShippingService>USPSEconomyParcel</ShippingService>
            <FreeShipping>true</FreeShipping>
            <ShippingServiceAdditionalCost currencyID="USD">0.00</ShippingServiceAdditionalCost>
          </ShippingServiceOptions>
        </ShippingDetails>
        <Site>US</Site>
      </Item>
    </AddFixedPriceItemRequest>`;

    const options = {
      Item: {
        Title: "Apple MacBook Pro MB990LL/A 13.3 in. Notebook NEW",
        Description: "Brand New Apple MacBook Pro MB990LL/A 13.3 in. Notebook!",
        StartPrice: "500.0",
        ConditionID: "1000",
        Country: "US",
        Currency: "USD",
        DispatchTimeMax: "3",
        ListingDuration: "Days_7",
        ListingType: "FixedPriceItem",
        PaymentMethods: "PayPal",
        PayPalEmailAddress: "megaonlinemerchant@gmail.com",
        PictureDetails: {
          PictureURL: [
            "http://i12.ebayimg.com/03/i/04/8a/5f/a1_1_sbl.JPG",
            "http://i22.ebayimg.com/01/i/04/8e/53/69_1_sbl.JPG",
            "http://i4.ebayimg.ebay.com/01/i/000/77/3c/d88f_1_sbl.JPG"
          ]
        },
        ProductListingDetails: {
          UPC: "885909298594",
          IncludeStockPhotoURL: "true",
          IncludeeBayProductDetails: "true",
          UseFirstProduct: "true",
          UseStockPhotoURLAsGallery: "true",
          ReturnSearchResultOnDuplicates: "true"
        },
        Quantity: 6,
        ReturnPolicy: {
          ReturnsAcceptedOption: "ReturnsAccepted",
          RefundOption: "MoneyBack",
          ReturnsWithinOption: "Days_30",
          Description: "If you are not satisfied, return the item for refund.",
          ShippingCostPaidByOption: "Buyer"
        },
        ShippingDetails: {
          ShippingType: "Flat",
          ShippingServiceOptions: {
            ShippingServicePriority: "1",
            ShippingService: "USPSEconomyParcel",
            FreeShipping: "true",
            ShippingServiceAdditionalCost: {
              "@": {
                currencyID: "USD"
              },
              "#": "0.00"
            }
          }
        },
        Site: "US"
      }
    };

    return ebayClient
      .addFixedPriceItem(options)
      .catch(error => {
        console.log(error.message);
      })
      .then(result => {
        assert.deepEqual(
          JSON.parse(toJson(postData.data)),
          JSON.parse(toJson(expectedPostData))
        );
        assert(result.Ack);
      });
  });

  it("getUserPreferencesOptions is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;

    const getUserPreferenceSample = fs
      .readFileSync(path.resolve(__dirname, "./getUserPreferenceSample.xml"))
      .toString();

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, getUserPreferenceSample];
    });

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?> 
    <GetUserPreferencesRequest xmlns="urn:ebay:apis:eBLBaseComponents"> 
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
      <ShowSellerPaymentPreferences>true</ShowSellerPaymentPreferences>
    </GetUserPreferencesRequest>`;

    return ebayClient
      .getUserPreferences()
      .catch(error => {
        console.log(error.message);
      })
      .then(result => {
        assert.deepEqual(
          JSON.parse(toJson(postData.data)),
          JSON.parse(toJson(expectedPostData))
        );
        assert(result.Ack);
      });
  });

  it("getMyeBaySelling is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;

    const getMyeBaySellingSample = fs
      .readFileSync(path.resolve(__dirname, "./getMyeBaySellingSample.xml"))
      .toString();

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, getMyeBaySellingSample];
    });

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?>
    <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <SellingSummary>
        <Include>true</Include>
      </SellingSummary>
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
    </GetMyeBaySellingRequest>`;

    return ebayClient
      .getMyeBaySelling()
      .catch(error => {
        console.log(error.message);
      })
      .then(result => {
        assert.deepEqual(
          JSON.parse(toJson(postData.data)),
          JSON.parse(toJson(expectedPostData))
        );
        assert(result.Ack);
      });
  });

  it("SetUserPreferences is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;

    const setUserPreferencesSample = fs
      .readFileSync(path.resolve(__dirname, "./setUserPreferences.xml"))
      .toString();

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, setUserPreferencesSample];
    });

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?> 
    <SetUserPreferencesRequest xmlns="urn:ebay:apis:eBLBaseComponents"> 
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
      <OutOfStockControlPreference>true</OutOfStockControlPreference>
    </SetUserPreferencesRequest> `;

    return ebayClient
      .setUserPreferences()
      .catch(error => {
        console.log(error.message);
      })
      .then(result => {
        assert.deepEqual(
          JSON.parse(toJson(postData.data)),
          JSON.parse(toJson(expectedPostData))
        );
        assert(result.Ack);
      });
  });

  it("ReviseInventoryStatus is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;

    const reviseInventoryStatusSample = fs
      .readFileSync(path.resolve(__dirname, "./setUserPreferences.xml"))
      .toString();

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, reviseInventoryStatusSample];
    });

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?>
    <ReviseInventoryStatusRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
      <InventoryStatus>
        <ItemID>110035400937</ItemID>
        <Quantity>20</Quantity>
      </InventoryStatus>
      <InventoryStatus>
        <SKU>cmg00002</SKU>
        <ItemID>110035406664</ItemID>
        <Quantity>20</Quantity>
      </InventoryStatus>
      <InventoryStatus>
        <ItemID>110035406665</ItemID>
        <StartPrice>9.95</StartPrice>
      </InventoryStatus>
      <InventoryStatus>
        <SKU>cmg00002</SKU>
        <ItemID>110035407916</ItemID>
        <StartPrice>19.95</StartPrice>
        <Quantity>80</Quantity>
      </InventoryStatus>
    </ReviseInventoryStatusRequest>`;

    const options = {
      InventoryStatus: [
        {
          ItemID: "110035400937",
          Quantity: 20
        },
        {
          SKU: "cmg00002",
          ItemID: "110035406664",
          Quantity: 20
        },
        {
          ItemID: "110035406665",
          StartPrice: 9.95
        },
        {
          SKU: "cmg00002",
          ItemID: "110035407916",
          StartPrice: 19.95,
          Quantity: 80
        }
      ]
    };
    return ebayClient
      .reviseInventoryStatus(options)
      .catch(error => {
        console.log(error.message);
      })
      .then(result => {
        assert.deepEqual(
          JSON.parse(toJson(postData.data)),
          JSON.parse(toJson(expectedPostData))
        );
        assert(result.Ack);
      });
  });

  it("RReviseFixedPriceItem is able to post correctly", () => {
    const ebayClient = new EbayClient(OAuthClientData);
    let postData;

    const reviseInventoryStatusSample = fs
      .readFileSync(path.resolve(__dirname, "./setUserPreferences.xml"))
      .toString();

    mock.onPost("https://api.sandbox.ebay.com/ws/api.dll").reply(postConfig => {
      postData = postConfig;
      return [200, reviseInventoryStatusSample];
    });

    const expectedPostData = `<?xml version="1.0" encoding="utf-8"?>
    <ReviseInventoryStatusRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
      <InventoryStatus>
        <ItemID>110035400937</ItemID>
        <Quantity>20</Quantity>
      </InventoryStatus>
      <InventoryStatus>
        <SKU>cmg00002</SKU>
        <ItemID>110035406664</ItemID>
        <Quantity>20</Quantity>
      </InventoryStatus>
      <InventoryStatus>
        <ItemID>110035406665</ItemID>
        <StartPrice>9.95</StartPrice>
      </InventoryStatus>
      <InventoryStatus>
        <SKU>cmg00002</SKU>
        <ItemID>110035407916</ItemID>
        <StartPrice>19.95</StartPrice>
        <Quantity>80</Quantity>
      </InventoryStatus>
    </ReviseInventoryStatusRequest>`;

    const options = {
      InventoryStatus: [
        {
          ItemID: "110035400937",
          Quantity: 20
        },
        {
          SKU: "cmg00002",
          ItemID: "110035406664",
          Quantity: 20
        },
        {
          ItemID: "110035406665",
          StartPrice: 9.95
        },
        {
          SKU: "cmg00002",
          ItemID: "110035407916",
          StartPrice: 19.95,
          Quantity: 80
        }
      ]
    };
    return ebayClient
      .reviseInventoryStatus(options)
      .catch(error => {
        console.log(error.message);
      })
      .then(result => {
        assert.deepEqual(
          JSON.parse(toJson(postData.data)),
          JSON.parse(toJson(expectedPostData))
        );
        assert(result.Ack);
      });
  });
});
