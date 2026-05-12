// SEND EMAILS
function sendEmailWithPlainTextOnly(input) {
  const message = 
    'MIME-Version: 1.0\r\n' +
    `To: <${input.to.email}>\r\n` +
    `From: <${input.from.email}>\r\n` +  // Use only the email address for 'From'
    `Subject: ${input.subject}\r\n` +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    `${input.body.plainText}\r\n`;

  sendRequest(message);
}


function sendEmailWithHTMLOnly(input) {
  const message = 
    'MIME-Version: 1.0\r\n' +
    `To: <${input.to.email}>\r\n` +
    `From: <${input.from.email}>\r\n` +  // Use only the email address for 'From'
    `Subject: ${input.subject}\r\n` +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    `${input.body.html}\r\n`;

  sendRequest(message);
}


function sendRequest(message) {
  const params = {
    method: "post",
    contentType: "message/rfc822",
    headers: {
      "Authorization": "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true,
    payload: message
  };

  try {
    const resp = UrlFetchApp.fetch("https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send", params);
    Logger.log("Email sent.");
    Logger.log(resp.getContentText()); // Log the response for debugging
  } catch (error) {
    Logger.log("Error: " + error.message);
  }
}






// SEND TELEGRAM MESSAGE



    // var textPayload = {
    //   method: "sendMessage",
    //   chat_id: referral.telegramId,
    //   text: formattedMessage,
    //   parse_mode: "Markdown",
    // };


    // // Call with both payloads
    // sendMediaAndMessageToTelegram(textPayload, null);


function sendMediaAndMessageToTelegram(textPayload, mediaPayload) {
  var token = '6731065950:AAFSfE-CuRZBKNEmBqKTQ3n9oV38i1g402Y'; // Replace with your Telegram Bot token
  var apiUrl = 'https://api.telegram.org/bot' + token;
  var messageId = null;

  if (textPayload) {
    var textUrl = apiUrl + '/sendMessage';
    var textOptions = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(textPayload)
    };
    var textResponse = UrlFetchApp.fetch(textUrl, textOptions);
    var textContent = JSON.parse(textResponse.getContentText());
    messageId = textContent.result.message_id; // Extract message ID from the response
    Logger.log(textContent); // Log the text message response (optional)
  }

  if (mediaPayload) {
    var mediaUrl = apiUrl + '/sendDocument';
    var mediaOptions = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(mediaPayload)
    };
    var mediaResponse = UrlFetchApp.fetch(mediaUrl, mediaOptions);
    Logger.log(mediaResponse.getContentText()); // Log the media message response (optional)
  }

  return messageId;
}


// Function to delete a message on Telegram
function deleteTelegramMessage(messageId) {
  var token = '6731065950:AAFSfE-CuRZBKNEmBqKTQ3n9oV38i1g402Y'; // Replace with your Telegram Bot token
  var apiUrl = 'https://api.telegram.org/bot' + token + '/deleteMessage';

  var deleteOptions = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({
      'chat_id': '-1002084026677',  // Replace with your chat ID
      'message_id': messageId
    })
  };

  var deleteResponse = UrlFetchApp.fetch(apiUrl, deleteOptions);
  Logger.log(deleteResponse.getContentText()); // Log the delete message response (optional)
}
