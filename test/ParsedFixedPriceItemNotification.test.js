const assert = require("assert");
const ParsedFixedPriceItemNotification = require("../lib/ParsedFixedPriceItemNotification");

const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<soapenv:Header>
 <ebl:RequesterCredentials soapenv:mustUnderstand="0" xmlns:ns="urn:ebay:apis:eBLBaseComponents" xmlns:ebl="urn:ebay:apis:eBLBaseComponents">
  <ebl:NotificationSignature xmlns:ebl="urn:ebay:apis:eBLBaseComponents">e1gi0K9FRSVU9UTL2AhVqw==</ebl:NotificationSignature>
 </ebl:RequesterCredentials>
</soapenv:Header>
<soapenv:Body>
 <GetItemTransactionsResponse xmlns="urn:ebay:apis:eBLBaseComponents">
  <Timestamp>2018-06-14T18:57:36.878Z</Timestamp>
  <Ack>Success</Ack>
  <CorrelationID>1339194608402</CorrelationID>
  <Version>1057</Version>
  <Build>E1057_CORE_APIXO_18684207_R1</Build>
  <NotificationEventName>FixedPriceTransaction</NotificationEventName>
  <RecipientUserID>zhangliandon_0</RecipientUserID>
  <EIASToken>nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6ABkYGmAZSDoQmdj6x9nY+seQ==</EIASToken>
  <PaginationResult>
   <TotalNumberOfPages>1</TotalNumberOfPages>
   <TotalNumberOfEntries>1</TotalNumberOfEntries>
  </PaginationResult>
  <HasMoreTransactions>false</HasMoreTransactions>
  <TransactionsPerPage>100</TransactionsPerPage>
  <PageNumber>1</PageNumber>
  <ReturnedTransactionCountActual>1</ReturnedTransactionCountActual>
  <FinalValueFee currencyID="USD">0.24</FinalValueFee>
  <Item>
   <AutoPay>false</AutoPay>
   <BuyerProtection>ItemIneligible</BuyerProtection>
   <BuyItNowPrice currencyID="USD">0.0</BuyItNowPrice>
   <Currency>USD</Currency>
   <ItemID>273296626758</ItemID>
   <ListingDetails>
    <StartTime>2018-06-14T18:52:06.000Z</StartTime>
    <EndTime>2018-07-14T18:52:06.000Z</EndTime>
    <ViewItemURL>http://cgi.ebay.com/ws/eBayISAPI.dll?ViewItem&amp;Item=273296626758</ViewItemURL>
    <ViewItemURLForNaturalSearch>http://cgi.ebay.com/LCD-Display-Touch-Screen-Digitizer-Assembly-Replacement-for-Iphone-6-TEST?item=273296626758&amp;category=0&amp;cmd=ViewItem</ViewItemURLForNaturalSearch>
   </ListingDetails>
   <ListingType>FixedPriceItem</ListingType>
   <PaymentMethods>PayPal</PaymentMethods>
   <PrimaryCategory>
    <CategoryID>43304</CategoryID>
   </PrimaryCategory>
   <PrivateListing>false</PrivateListing>
   <Quantity>12</Quantity>
   <SecondaryCategory>
    <CategoryID>0</CategoryID>
   </SecondaryCategory>
   <Seller>
    <AboutMePage>false</AboutMePage>
    <EIASToken>nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6ABkYGmAZSDoQmdj6x9nY+seQ==</EIASToken>
    <Email>zhanglid@usc.edu</Email>
    <FeedbackScore>4</FeedbackScore>
    <PositiveFeedbackPercent>100.0</PositiveFeedbackPercent>
    <FeedbackPrivate>false</FeedbackPrivate>
    <FeedbackRatingStar>None</FeedbackRatingStar>
    <IDVerified>false</IDVerified>
    <eBayGoodStanding>true</eBayGoodStanding>
    <NewUser>false</NewUser>
    <RegistrationDate>2016-08-04T19:41:06.000Z</RegistrationDate>
    <Site>US</Site>
    <Status>Confirmed</Status>
    <UserID>zhangliandon_0</UserID>
    <UserIDChanged>false</UserIDChanged>
    <VATStatus>NoVATTax</VATStatus>
    <SellerInfo>
     <AllowPaymentEdit>true</AllowPaymentEdit>
     <CheckoutEnabled>true</CheckoutEnabled>
     <CIPBankAccountStored>false</CIPBankAccountStored>
     <GoodStanding>true</GoodStanding>
     <LiveAuctionAuthorized>false</LiveAuctionAuthorized>
     <MerchandizingPref>OptIn</MerchandizingPref>
     <QualifiesForB2BVAT>false</QualifiesForB2BVAT>
     <StoreOwner>false</StoreOwner>
     <SafePaymentExempt>false</SafePaymentExempt>
    </SellerInfo>
   </Seller>
   <SellingStatus>
    <ConvertedCurrentPrice currencyID="USD">1.01</ConvertedCurrentPrice>
    <CurrentPrice currencyID="USD">1.01</CurrentPrice>
    <QuantitySold>2</QuantitySold>
    <ListingStatus>Active</ListingStatus>
   </SellingStatus>
   <Site>US</Site>
   <StartPrice currencyID="USD">1.01</StartPrice>
   <Title>LCD Display Touch Screen Digitizer Assembly Replacement for Iphone 6 TEST</Title>
   <GetItFast>false</GetItFast>
   <IntegratedMerchantCreditCardEnabled>false</IntegratedMerchantCreditCardEnabled>
   <ConditionID>3000</ConditionID>
   <ConditionDisplayName>Used</ConditionDisplayName>
  </Item>
  <TransactionArray>
   <Transaction>
    <AmountPaid currencyID="USD">2.03</AmountPaid>
    <AdjustmentAmount currencyID="USD">0.0</AdjustmentAmount>
    <ConvertedAdjustmentAmount currencyID="USD">0.0</ConvertedAdjustmentAmount>
    <Buyer>
     <AboutMePage>false</AboutMePage>
     <EIASToken>nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6AGkIumDpiBoASdj6x9nY+seQ==</EIASToken>
     <Email>gmofeng@gmail.com</Email>
     <FeedbackScore>94</FeedbackScore>
     <PositiveFeedbackPercent>0.0</PositiveFeedbackPercent>
     <FeedbackPrivate>false</FeedbackPrivate>
     <FeedbackRatingStar>Blue</FeedbackRatingStar>
     <IDVerified>false</IDVerified>
     <eBayGoodStanding>true</eBayGoodStanding>
     <NewUser>false</NewUser>
     <RegistrationDate>2013-12-10T19:57:11.000Z</RegistrationDate>
     <Site>US</Site>
     <Status>Confirmed</Status>
     <UserID>redystone</UserID>
     <UserIDChanged>false</UserIDChanged>
     <UserIDLastChanged>2015-04-13T11:10:30.000Z</UserIDLastChanged>
     <VATStatus>NoVATTax</VATStatus>
     <BuyerInfo>
      <ShippingAddress>
       <Name>Anyi Wang</Name>
       <Street1>13660 Norton Ave</Street1>
       <CityName>Chino</CityName>
       <StateOrProvince>CA</StateOrProvince>
       <Country>US</Country>
       <CountryName>United States</CountryName>
       <Phone>(626) 594-8768</Phone>
       <PostalCode>91710-4909</PostalCode>
       <AddressID>2374213515021</AddressID>
       <AddressOwner>eBay</AddressOwner>
       <AddressUsage>DefaultShipping</AddressUsage>
      </ShippingAddress>
     </BuyerInfo>
     <UserAnonymized>false</UserAnonymized>
     <StaticAlias>332757_grw6246uc@members.ebay.com</StaticAlias>
     <UserFirstName>Anthony</UserFirstName>
     <UserLastName>Wang</UserLastName>
    </Buyer>
    <ShippingDetails>
     <ChangePaymentInstructions>true</ChangePaymentInstructions>
     <PaymentEdited>true</PaymentEdited>
     <SalesTax>
      <SalesTaxPercent>0.0</SalesTaxPercent>
      <ShippingIncludedInTax>false</ShippingIncludedInTax>
      <SalesTaxAmount currencyID="USD">0.0</SalesTaxAmount>
     </SalesTax>
     <ShippingType>NotSpecified</ShippingType>
     <SellingManagerSalesRecordNumber>103</SellingManagerSalesRecordNumber>
     <ThirdPartyCheckout>false</ThirdPartyCheckout>
     <TaxTable/>
     <GetItFast>false</GetItFast>
    </ShippingDetails>
    <ConvertedAmountPaid currencyID="USD">2.03</ConvertedAmountPaid>
    <ConvertedTransactionPrice currencyID="USD">1.01</ConvertedTransactionPrice>
    <CreatedDate>2018-06-14T18:57:31.000Z</CreatedDate>
    <DepositType>None</DepositType>
    <QuantityPurchased>1</QuantityPurchased>
    <Status>
     <eBayPaymentStatus>NoPaymentFailure</eBayPaymentStatus>
     <CheckoutStatus>CheckoutComplete</CheckoutStatus>
     <LastTimeModified>2018-06-14T18:57:32.000Z</LastTimeModified>
     <PaymentMethodUsed>PayPal</PaymentMethodUsed>
     <CompleteStatus>Complete</CompleteStatus>
     <BuyerSelectedShipping>true</BuyerSelectedShipping>
     <PaymentHoldStatus>None</PaymentHoldStatus>
     <IntegratedMerchantCreditCardEnabled>false</IntegratedMerchantCreditCardEnabled>
     <InquiryStatus>NotApplicable</InquiryStatus>
     <ReturnStatus>NotApplicable</ReturnStatus>
     <PaymentInstrument>PayPal</PaymentInstrument>
    </Status>
    <TransactionID>2005199002017</TransactionID>
    <TransactionPrice currencyID="USD">1.01</TransactionPrice>
    <BestOfferSale>false</BestOfferSale>
    <ExternalTransaction>
     <ExternalTransactionID>66B99023DY944961E</ExternalTransactionID>
     <ExternalTransactionTime>2018-06-14T18:57:29.000Z</ExternalTransactionTime>
     <FeeOrCreditAmount currencyID="USD">0.36</FeeOrCreditAmount>
     <PaymentOrRefundAmount currencyID="USD">2.03</PaymentOrRefundAmount>
     <ExternalTransactionStatus>Succeeded</ExternalTransactionStatus>
    </ExternalTransaction>
    <ShippingServiceSelected>
      <ShippingService>UPSGround</ShippingService>
      <ShippingServiceCost currencyID="USD">1.0</ShippingServiceCost>
      <ShippingPackageInfo>
       <EstimatedDeliveryTimeMin>2018-06-25T07:00:00.000Z</EstimatedDeliveryTimeMin>
       <EstimatedDeliveryTimeMax>2018-06-25T07:00:00.000Z</EstimatedDeliveryTimeMax>
      </ShippingPackageInfo>
     </ShippingServiceSelected>
    <PaidTime>2018-06-14T18:57:32.000Z</PaidTime>
    <ContainingOrder>
     <OrderID>242467059018</OrderID>
     <OrderStatus>Completed</OrderStatus>
     <ShippingDetails>
      <SellingManagerSalesRecordNumber>105</SellingManagerSalesRecordNumber>
     </ShippingDetails>
     <CreatingUserRole>Buyer</CreatingUserRole>
     <CancelStatus>NotApplicable</CancelStatus>
     <ExtendedOrderID>242467059018!180000184429176</ExtendedOrderID>
     <ContainseBayPlusTransaction>false</ContainseBayPlusTransaction>
    </ContainingOrder>
    <FinalValueFee currencyID="USD">0.1</FinalValueFee>
    <TransactionSiteID>US</TransactionSiteID>
    <Platform>eBay</Platform>
    <PayPalEmailAddress>zhanglid@usc.edu</PayPalEmailAddress>
    <Variation>
      <SKU>SKU-2</SKU>
      <VariationSpecifics>
       <NameValueList>
        <Name>Color</Name>
        <Value>White</Value>
       </NameValueList>
       <NameValueList>
        <Name>Model</Name>
        <Value>5</Value>
       </NameValueList>
      </VariationSpecifics>
      <VariationTitle>Real Tempered Glass Screen Protector Guard For Samsung Galaxy test relist2[White,5]</VariationTitle>
      <VariationViewItemURL>http://cgi.ebay.com/ws/eBayISAPI.dll?ViewItem&amp;item=132670494642&amp;vti=Color%09White%0AModel%095</VariationViewItemURL>
     </Variation>
    <ActualShippingCost currencyID="USD">0.0</ActualShippingCost>
    <ActualHandlingCost currencyID="USD">0.0</ActualHandlingCost>
    <OrderLineItemID>273296626758-2005199002017</OrderLineItemID>
    <IsMultiLegShipping>false</IsMultiLegShipping>
    <IntangibleItem>false</IntangibleItem>
    <MonetaryDetails>
     <Payments>
      <Payment>
       <PaymentStatus>Succeeded</PaymentStatus>
       <Payer type="eBayUser">redystone</Payer>
       <Payee type="eBayUser">zhangliandon_0</Payee>
       <PaymentTime>2018-06-14T18:57:29.000Z</PaymentTime>
       <PaymentAmount currencyID="USD">2.03</PaymentAmount>
       <ReferenceID type="ExternalTransactionID">66B99023DY944961E</ReferenceID>
       <FeeOrCreditAmount currencyID="USD">0.36</FeeOrCreditAmount>
      </Payment>
     </Payments>
    </MonetaryDetails>
    <ExtendedOrderID>242467059018!180000184429176</ExtendedOrderID>
    <eBayPlusTransaction>false</eBayPlusTransaction>
    <GuaranteedShipping>false</GuaranteedShipping>
    <GuaranteedDelivery>false</GuaranteedDelivery>
   </Transaction>
  </TransactionArray>
  <PayPalPreferred>false</PayPalPreferred>
 </GetItemTransactionsResponse>
</soapenv:Body>
</soapenv:Envelope>`;

let notification = null;

before(() => {
  return ParsedFixedPriceItemNotification.fromXML(xml).then(
    result => (notification = result)
  );
});

describe("parse value correctly", () => {
  it("parse success status", () => {
    assert.equal(notification.parseStatus(), "Success");
  });

  it("parse event name", () => {
    assert.equal(notification.parseType(), "FixedPriceTransaction");
  });

  it("parse email", () => {
    assert.equal(notification.parseUserEmail(), "zhanglid@usc.edu");
  });

  it("parse total price", () => {
    assert.equal(notification.parseTotalPrice()._, "2.03");
    assert.equal(notification.parseTotalPrice().$.currencyID, "USD");
  });

  it("parse transaction price", () => {
    assert.equal(notification.parseTransactionPrice()._, "1.01");
    assert.equal(notification.parseTransactionPrice().$.currencyID, "USD");
  });

  it("parse record number", () => {
    assert.equal(notification.parseRecordNumber(), "103");
  });

  it("parse user id", () => {
    assert.equal(notification.parseUserId(), "zhangliandon_0");
  });

  it("parse order id", () => {
    assert.equal(notification.parseOrderId(), "242467059018");
  });
  it("parse buyer id", () => {
    assert.equal(notification.parseBuyerId(), "redystone");
  });

  it("parse ebay_order_createdTime id", () => {
    assert.equal(
      notification.parseOrderCreatedTime(),
      "2018-06-14T18:57:31.000Z"
    );
  });

  it("parse ebay_order_status", () => {
    assert.equal(notification.parseOrderStatus(), "Completed");
  });
  it("parse ebay_order_cancelStatus", () => {
    assert.equal(notification.parseOrderCancelStatus(), "NotApplicable");
  });
  it("parse item", () => {
    assert.deepEqual(notification.parseItem(), {
      orderlineitem_id: "273296626758-2005199002017",
      buyer: "redystone",
      qty: "1",
      price: {
        $: {
          currencyID: "USD"
        },
        _: "1.01"
      },
      estimate_delivery: "2018-06-25T07:00:00.000Z",
      itemId: "273296626758",
      quantity: "12",
      sold: "2",
      variation: [
        { Name: ["Color"], Value: ["White"] },
        { Name: ["Model"], Value: ["5"] }
      ]
    });
  });

  it("parse shipping address", () => {
    assert.deepEqual(notification.parseShippingAddress(), {
      name: "Anyi Wang",
      city: "Chino",
      state: "CA",
      country: "US",
      phone: "(626) 594-8768",
      zip: "91710-4909",
      line1: "13660 Norton Ave",
      line2: undefined
    });
  });

  it("parse shipping method", () => {
    assert.equal(notification.parseShippingMethod(), "UPSGround");
  });
  it("parse EstimatedDeliveryTime", () => {
    assert.equal(
      notification.parseEstimatedDeliveryTime(),
      "2018-06-25T07:00:00.000Z"
    );
  });
  it("parse Signature", () => {
    assert.equal(notification.parseSignature(), "e1gi0K9FRSVU9UTL2AhVqw==");
  });

  it("parse Timestamp", () => {
    assert.equal(notification.parseTimestamp(), "2018-06-14T18:57:36.878Z");
  });

  it("parse buyer email", () => {
    assert.equal(notification.parseBuyerEmail(), "gmofeng@gmail.com");
  });

  it("parse EventName", () => {
    assert.equal(notification.parseEventName(), "FixedPriceTransaction");
  });

  it("parse FinalValueFee", () => {
    assert.deepEqual(notification.parseFinalValueFee(), {
      $: {
        currencyID: "USD"
      },
      _: "0.24"
    });
  });
});
