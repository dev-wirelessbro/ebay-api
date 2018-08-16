const EbaySigVerifier = require("../lib/EbaySigVerifier");
const assert = require("assert");
const moment = require("moment");


const verifier = new EbaySigVerifier(
  "Wireless-wireless-SBX-85d705b3d-529548a6",
  "b8172ffc-3930-41e4-a3c1-9d554e592fe7",
  "SBX-5d705b3d6c82-1c55-473a-8979-04be"
);

describe("`calculateSig` is able to calculate digest correctly", () => {
  it("case 1 2018-06-13T00:33:48.502Z", () => {
    const timestamp = "2018-06-13T00:33:48.502Z";
    const notificationSig = "M6yRqK0ShRjQ5Te/yt6U0A==";
    assert.equal(verifier.calculateSig(timestamp), notificationSig);
  });

  it("case 2 2018-06-13T00:33:48.502Z", () => {
    const timestamp = "2018-06-13T00:33:48.502Z";
    const notificationSig = "M6yRqK0ShRjQ5Te/yt6U0A=1";
    assert.notEqual(verifier.calculateSig(timestamp), notificationSig);
  });

  it("case 2 2018-06-13T00:52:36.065Z", () => {
    const timestamp = "2018-06-13T00:52:36.065Z";
    const notificationSig = "I3i/0QnyyS/S3n040ygHew==";
    assert.equal(verifier.calculateSig(timestamp), notificationSig);
  });
});

describe("`verify` is able to check the notification is in 10 minutes from now", () => {
  it("within 10 minute should be verified as true", () => {
    const timestamp = moment().subtract(5, "minute");
    const sig = verifier.calculateSig(timestamp);
    assert.equal(verifier.verify(timestamp, sig), true);
  });

  it("out of 10 minute should be verified as false", () => {
    const timestamp = moment().subtract(10, "minute").subtract(1, 'ms');
    const sig = verifier.calculateSig(timestamp);
    assert.equal(verifier.verify(timestamp, sig), false);
  });

  it("time in the feature should be verified as false", () => {
    const timestamp = moment().add(1, "minute");
    const sig = verifier.calculateSig(timestamp);
    assert.equal(verifier.verify(timestamp, sig), false);
  });
});


describe("`verifyXML` is able to check the XML", () => {
  it("should be true", async () => {
    const timestamp = moment().subtract(5, "minute").toISOString();
    const sig = verifier.calculateSig(timestamp);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://
          www.w3.org/2001/XMLSchema"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <soapenv:Header>
            <ebl:RequesterCredentials soapenv:mustUnderstand="0" xmlns:ns="urn:ebay:apis:eBLBaseComponents" xmlns:ebl="urn:ebay:apis:eBLBaseComponents">
            <ebl:NotificationSignature xmlns:ebl="urn:ebay:apis:eBLBaseComponents">${sig}</ebl:NotificationSignature>
            </ebl:RequesterCredentials>
          </soapenv:Header>
          <soapenv:Body>
            <GetMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
            <Timestamp>${timestamp}</Timestamp>
            <Ack>Success</Ack>
            <CorrelationID>94654140</CorrelationID>
            <Version>423</Version>
            <Build>e423_core_API_1556612_R1</Build>
            <NotificationEventName>MyMessageseBayMessageHeader</NotificationEventName>
            <RecipientUserID>sampleuser</RecipientUserID>
            <Messages>
              <Message>
              <Sender>testuser</Sender>
              <RecipientUserID>sampleuser</RecipientUserID>
              <Subject>The request with originalMessageId</Subject>
              <MessageID>1989403</MessageID>
              <Flagged>false</Flagged>
              <Read>false</Read>
              <ReceiveDate>2005-08-04T22:52:08.000Z</ReceiveDate>
              <ExpirationDate>2005-10-03T22:52:08.000Z</ExpirationDate>
              <ResponseDetails>
                <ResponseEnabled>false</ResponseEnabled>
              </ResponseDetails>
              <Folder>
                <FolderID>0</FolderID>
              </Folder>
              </Message>
            </Messages>
            </GetMyMessagesResponse>
          </soapenv:Body>
          </soapenv:Envelope>`

    assert.equal(await verifier.verifyXML(xml), true);
  });

  it("should be false", async () => {
    const timestamp = moment().subtract(15, "minute").toISOString();
    const sig = verifier.calculateSig(timestamp);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://
          www.w3.org/2001/XMLSchema"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <soapenv:Header>
            <ebl:RequesterCredentials soapenv:mustUnderstand="0" xmlns:ns="urn:ebay:apis:eBLBaseComponents" xmlns:ebl="urn:ebay:apis:eBLBaseComponents">
            <ebl:NotificationSignature xmlns:ebl="urn:ebay:apis:eBLBaseComponents">${sig}</ebl:NotificationSignature>
            </ebl:RequesterCredentials>
          </soapenv:Header>
          <soapenv:Body>
            <GetMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
            <Timestamp>${timestamp}</Timestamp>
            <Ack>Success</Ack>
            <CorrelationID>94654140</CorrelationID>
            <Version>423</Version>
            <Build>e423_core_API_1556612_R1</Build>
            <NotificationEventName>MyMessageseBayMessageHeader</NotificationEventName>
            <RecipientUserID>sampleuser</RecipientUserID>
            <Messages>
              <Message>
              <Sender>testuser</Sender>
              <RecipientUserID>sampleuser</RecipientUserID>
              <Subject>The request with originalMessageId</Subject>
              <MessageID>1989403</MessageID>
              <Flagged>false</Flagged>
              <Read>false</Read>
              <ReceiveDate>2005-08-04T22:52:08.000Z</ReceiveDate>
              <ExpirationDate>2005-10-03T22:52:08.000Z</ExpirationDate>
              <ResponseDetails>
                <ResponseEnabled>false</ResponseEnabled>
              </ResponseDetails>
              <Folder>
                <FolderID>0</FolderID>
              </Folder>
              </Message>
            </Messages>
            </GetMyMessagesResponse>
          </soapenv:Body>
          </soapenv:Envelope>`

    assert.equal(await verifier.verifyXML(xml), false);
  });

});