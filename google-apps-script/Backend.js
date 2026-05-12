function doGet(e) {
  const sheetName = e.parameter.sheetname; 
  if (!sheetName) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Missing parameter" })).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: `DB '${sheetName}' not found` })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getDisplayValues();
  const headers = data[0]; 
  const rows = data.slice(1); 

  const result = rows.map(row => {
    return headers.reduce((obj, header, i) => {
      obj[header] = row[i];
      return obj;
    }, {});
  });

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = e.parameter; 
    const action = params.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ticketSheet = ss.getSheetByName("ticket"); 
    const userSheet = ss.getSheetByName("user");   

    if (!ticketSheet || !userSheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Required sheets not found" })).setMimeType(ContentService.MimeType.JSON);
    }

    switch (action) {
      case "ticketApproval":
        return ticketApproval(userSheet, params);
      case "retractTicket":
        return retractTicket(userSheet, params);
      case "addTicket":
        return addTicket(ticketSheet, params);
      case "updateTicket":
        return updateTicket(ticketSheet, params);
      case "transferTicket":
        return transferTicket(userSheet, params);
      case "deleteTicket":
        return deleteTicket(ticketSheet, params);
      default:
        return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to get email sender for a platform from settings sheet
 */
function getPlatformEmailSender(platform) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName("settings");
  if (!settingsSheet) return null;
  
  const data = settingsSheet.getDataRange().getDisplayValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const platformIdx = headers.indexOf("platform");
  const emailIdx = headers.indexOf("emailSender");
  
  if (platformIdx === -1 || emailIdx === -1) return null;
  
  const config = rows.find(row => row[platformIdx].toLowerCase() === platform.toLowerCase());
  return config ? config[emailIdx] : null;
}

function ticketApproval(sheet, params) {
  const headers = sheet.getDataRange().getValues()[0];
  const userIdCol = headers.indexOf("userId");
  const approvalSTAMPCol = headers.indexOf("approvalSTAMP");
  const platformCol = headers.indexOf("userPlatform");

  if (userIdCol === -1 || approvalSTAMPCol === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Required columns missing" })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[userIdCol] == params.userId);

  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: "User ID not found" })).setMimeType(ContentService.MimeType.JSON);
  }

  const isDeclined = params.approvalSTAMP === "DECLINED";
  const valueToSet = isDeclined ? "DECLINED" : new Date();
  sheet.getRange(rowIndex + 1, approvalSTAMPCol + 1).setValue(valueToSet);

  if (!isDeclined) {
    const platform = platformCol !== -1 ? (data[rowIndex][platformCol] || "viagogo") : "viagogo";
    const user = {
      fullName: data[rowIndex][headers.indexOf("fullName")],
      eventName: data[rowIndex][headers.indexOf("eventName")],
      eventDate: data[rowIndex][headers.indexOf("eventDate")],
      eventVenue: data[rowIndex][headers.indexOf("eventVenue")],
      seatNumber: data[rowIndex][headers.indexOf("seatNumber")],
      senderName: data[rowIndex][headers.indexOf("senderName")] || "Viagogo",
      approvalStatus: params.approvalSTAMP,
    };

    const receiverEmail = data[rowIndex][headers.indexOf("emailAddress")];
    const templateName = platform + "Accepted"; 
    const subject = `Your ticket for ${user.eventName} is being processed!`;

    // Dynamic Sender Email from Settings
    const senderEmail = getPlatformEmailSender(platform) || data[rowIndex][headers.indexOf("senderEmail")] || "no-reply@viagogo.com";

    sendTemplatedEmail(senderEmail, receiverEmail, user, templateName, subject);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: `Approval submitted${isDeclined ? '' : ' and email sent'}`
  })).setMimeType(ContentService.MimeType.JSON);
}

function retractTicket(sheet, params) {
  const headers = sheet.getDataRange().getValues()[0];
  const userIdCol = headers.indexOf("userId");
  const cancelledSTAMPCol = headers.indexOf("cancelledSTAMP");
  const platformCol = headers.indexOf("userPlatform");

  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[userIdCol] == params.userId);

  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: "User ID not found" })).setMimeType(ContentService.MimeType.JSON);
  }

  sheet.getRange(rowIndex + 1, cancelledSTAMPCol + 1).setValue(new Date());

  const platform = platformCol !== -1 ? (data[rowIndex][platformCol] || "viagogo") : "viagogo";
  const user = {
    fullName: data[rowIndex][headers.indexOf("fullName")],
    eventName: data[rowIndex][headers.indexOf("eventName")],
    senderName: data[rowIndex][headers.indexOf("senderName")] || "Viagogo",
  };

  const receiverEmail = data[rowIndex][headers.indexOf("emailAddress")];
  const templateName = platform + "Returned"; 
  const subject = `Your ticket transfer for ${user.eventName} has been retracted`;

  // Dynamic Sender Email from Settings
  const senderEmail = getPlatformEmailSender(platform) || data[rowIndex][headers.indexOf("senderEmail")] || "no-reply@viagogo.com";

  sendTemplatedEmail(senderEmail, receiverEmail, user, templateName, subject);

  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Ticket transfer retracted successfully" })).setMimeType(ContentService.MimeType.JSON);
}

function transferTicket(userSheet, params) {
  const headers = userSheet.getDataRange().getValues()[0];
  
  const newRow = headers.map(header => params[header] || "");
  userSheet.appendRow(newRow);

  Utilities.sleep(2000);
  const lastRow = userSheet.getLastRow();
  const rowValues = userSheet.getRange(lastRow, 1, 1, headers.length).getValues()[0];

  const userData = {};
  headers.forEach((header, index) => {
    userData[header] = rowValues[index];
  });

  const platform = params.userPlatform || "viagogo";
  const sendType = params.sendType || "draft"; // "draft" or "auto"
  const user = {
    fullName: params.fullName,
    eventName: userData.eventName,
    seatNumbers: params.seatNumbers,
    ticketId: params.ticketId,
    senderName: params.senderName,
    senderEmail: params.senderEmail,
    coverImage: userData.coverImage,
    dateTime: userData.dateTime,
    doorTime: userData.doorTime,
    venue: userData.venue,
    location: userData.location,
    section: userData.section,
    sectionNo: userData.sectionNo,
    row: userData.row,
    ageRestriction: userData.ageRestriction,
    description: userData.description,
    terms: userData.terms,
    link: userData.link,
  };

  const receiverEmail = params.emailAddress;
  const templateName = platform + "Transfer";
  const subject = `Fwd: ${params.senderName} Transferred your Tickets for ${userData.eventName}`;

  // Dynamic Sender Email from Settings
  const senderEmail = getPlatformEmailSender(platform) || params.senderEmail;

  if (sendType === "draft") {
    draftTemplatedEmail(senderEmail, receiverEmail, user, templateName, subject);
  } else {
    sendTemplatedEmail(senderEmail, receiverEmail, user, templateName, subject);
  }

  const newTransferSTAMPIndex = headers.indexOf('newTransferSTAMP');
  if (newTransferSTAMPIndex !== -1) {
    userSheet.getRange(lastRow, newTransferSTAMPIndex + 1).setValue(new Date());
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: sendType === "draft" ? "Ticket transferred and email drafted successfully" : "Ticket transferred and email sent successfully"
  })).setMimeType(ContentService.MimeType.JSON);
}

function addTicket(sheet, params) {
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = headers.map(header => params[header] || "");
  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function updateTicket(sheet, params) {
  const headers = sheet.getDataRange().getValues()[0];
  const ticketIdCol = headers.indexOf("ticketId");
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[ticketIdCol] == params.ticketId);

  if (rowIndex === -1) return ContentService.createTextOutput(JSON.stringify({ error: "Not found" })).setMimeType(ContentService.MimeType.JSON);

  headers.forEach((header, index) => {
    if (params[header] && index !== ticketIdCol) {
      sheet.getRange(rowIndex + 1, index + 1).setValue(params[header]);
    }
  });
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function deleteTicket(sheet, params) {
  const headers = sheet.getDataRange().getValues()[0];
  const ticketIdCol = headers.indexOf("ticketId");
  const deletedSTAMPCol = headers.indexOf("deletedSTAMP");
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[ticketIdCol] == params.ticketId);

  if (rowIndex === -1) return ContentService.createTextOutput(JSON.stringify({ error: "Not found" })).setMimeType(ContentService.MimeType.JSON);

  sheet.getRange(rowIndex + 1, deletedSTAMPCol + 1).setValue(params.deletedSTAMP);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function sendTemplatedEmail(senderEmail, receiverEmail, templateData, templateName, subject) {
  try {
    const templateFile = HtmlService.createTemplateFromFile(templateName);
    templateFile.templateData = templateData;
    const htmlBody = templateFile.evaluate().getContent();
    
    GmailApp.sendEmail(receiverEmail, subject, 'Please use an HTML-compatible email client to view this ticket transfer.', {
      htmlBody: htmlBody,
    });
    return true;
  } catch (error) {
    Logger.log("Error: " + error.message);
    return false;
  }
}

function draftTemplatedEmail(senderEmail, receiverEmail, templateData, templateName, subject) {
  try {
    const templateFile = HtmlService.createTemplateFromFile(templateName);
    templateFile.templateData = templateData;
    const htmlBody = templateFile.evaluate().getContent();
    
    GmailApp.createDraft(receiverEmail, subject, 'Please use an HTML-compatible email client to view this ticket transfer.', {
      htmlBody: htmlBody,
    });
    return true;
  } catch (error) {
    Logger.log("Error: " + error.message);
    return false;
  }
}