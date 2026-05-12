// helpers.gs

function oneMinuteRunner() {
  sendEmailsBasedOnConditions();
  //createPdfForRows();
}


function sendEmailsBasedOnConditions() {
  const sheet = SpreadsheetApp.openById("1Y9_BZB-eKgygfi4DL-w6w_1wXLEf4OiMPMWvdeXwxEc").getSheetByName("user");
  const data = sheet.getDataRange().getDisplayValues();
  const headers = data[0];

  // Define the column indices based on header names
  const fullNameIndex = headers.indexOf('fullName');
  const emailAddressIndex = headers.indexOf('emailAddress');
  const systemStatusIndex = headers.indexOf('systemStatus');
  const newTransferSTAMPIndex = headers.indexOf('newTransferSTAMP');
  const approvalSTAMPIndex = headers.indexOf('approvalSTAMP');
  const completedSTAMPIndex = headers.indexOf('completedSTAMP');
  const returnedSTAMPIndex = headers.indexOf('returnedSTAMP');
  const cancelledSTAMPIndex = headers.indexOf('cancelledSTAMP');

  if (emailAddressIndex === -1 || systemStatusIndex === -1 || completedSTAMPIndex === -1 || returnedSTAMPIndex === -1 || cancelledSTAMPIndex === -1) {
    Logger.log("ERROR: One or more required columns are missing.");
    return;
  }

  // Loop through all rows (skip header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = headers.reduce((obj, header, index) => {
      obj[header] = row[index];
      return obj;
    }, {});

    const fullName = rowData['fullName'];
    const emailAddress = rowData['emailAddress'];
    const systemStatus = rowData['systemStatus'];
    const newTransferSTAMP = new Date(rowData['newTransferSTAMP']); // Convert to Date object
    const approvalSTAMP = rowData['approvalSTAMP'];
    const completedSTAMP = rowData['completedSTAMP'];
    const returnedSTAMP = rowData['returnedSTAMP'];
    const cancelledSTAMP = rowData['cancelledSTAMP'];

    // Check condition 1:
    if (systemStatus === "COMPLETED" && !completedSTAMP) {
      sendEmail("ticketDispute.html", fullName, rowData, "Ticket transfer completed");
      sheet.getRange(i + 1, completedSTAMPIndex + 1).setValue(new Date());
    }

    // Check condition 2:
    // Check if 24 hours have passed since newTransferSTAMP and approvalSTAMP is missing
    if (!approvalSTAMP && newTransferSTAMP.getTime() + 24 * 60 * 60 * 1000 < new Date().getTime() && !returnedSTAMP) {
      sendEmail("returned.html", fullName, rowData, "Ticket transfer retracted!");
      sheet.getRange(i + 1, returnedSTAMPIndex + 1).setValue(new Date());
    }
  }
}

function sendEmail(templateName, fullName, rowData, subject) {
  // Load HTML template
  const htmlTemplate = HtmlService.createHtmlOutputFromFile(templateName).getContent();
  
  // Replace variables in the HTML template
  let emailContent = htmlTemplate.replace("{{fullname}}", fullName);

  // Additional variable replacements based on rowData (e.g., using other headers like email, etc.)
  for (let key in rowData) {
    const value = rowData[key];
    const regex = new RegExp(`{{${key}}}`, 'g');  // Handle multiple instances of the placeholder
    emailContent = emailContent.replace(regex, value);
  }

  // Define sender name and email
  const senderEmail = "no-reply@ticketmaster.com";  // Your verified email address
  const senderName = "TicketMaster";  // The name you want to display as the sender

  // Send the email (example: assuming the "email" column exists in the rowData)
  const recipientEmail = rowData['emailAddress'];
  if (recipientEmail) {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      htmlBody: emailContent,
      from: senderEmail, // Sender's email address
      name: senderName  // Display name for the sender
    });
    Logger.log(`Email sent to ${recipientEmail}`);
  } else {
    Logger.log(`No email address found for ${fullName}`);
  }
}




function createFoldersAndSetUserFolderId() {
  // Get the active sheet and data range
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('user');
  var data = sheet.getDataRange().getValues();
  
  // Find the indices for the relevant columns
  var header = data[0]; // First row is the header row
  var userIdCol = header.indexOf('userId');           // Get column index for userId
  var fullNameCol = header.indexOf('fullName');       // Get column index for fullName
  var emailCol = header.indexOf('emailAddress');      // Get column index for emailAddress
  var userFolderIdCol = header.indexOf('userFolderId'); // Get column index for userFolderId
  
  // Define the Parent Folder ID
  var parentFolderId = '1tiSS3-vgiGbnW80vkfZrtmdn_h-z9Hpc';
  var parentFolder = DriveApp.getFolderById(parentFolderId);  // Get the parent folder

  // Loop through each row starting from row 2 (to skip the header)
  for (var i = 1; i < data.length; i++) {
    var userId = data[i][userIdCol];
    var fullName = data[i][fullNameCol];
    var emailAddress = data[i][emailCol];
    var userFolderId = data[i][userFolderIdCol];
    
    // Check if the emailAddress is not empty
    if (emailAddress !== "" && userFolderId === "") {
      // Create the folder with the name from userId and fullName
      var folderName = userId + ' ' + fullName;
      var folder = parentFolder.createFolder(folderName); // Create a new folder inside the parent folder
      
      // Set the folder ID in the userFolderId column
      sheet.getRange(i + 1, userFolderIdCol + 1).setValue(folder.getId());
    }
  }
}

function createPdfForRows() {
  const sheet = SpreadsheetApp.openById("1kcC7qDS3wE7Y-I3b801aI_KmJr3yB_36CJyKVY2iaSw").getSheetByName("user");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  // Get the index of the necessary columns
  const agreementIndex = headers.indexOf('letterTemplate');
  const userFolderIdIndex = headers.indexOf('userFolderId'); // This is the column with unique folder IDs

  if (userFolderIdIndex === -1) {
    Logger.log("ERROR: The 'userFolderId' column is missing.");
    return; // Exit if 'userFolderId' column is not found
  }

  Logger.log("Started processing rows...");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = headers.reduce((obj, header, index) => {
      obj[header] = row[index];
      return obj;
    }, {});

    // Log row processing start
    Logger.log(`Processing row ${i + 1} for ${rowData['fullName']}`);

    // Check conditions: walletApproval is true and agreement is blank
    if (rowData['frontId'] != "" && !rowData['letterTemplate']) {
      const targetFolderId = rowData['userFolderId'];  // Dynamically get targetFolderId from the userFolderId column

      // Log if folderId is not found
      if (!targetFolderId) {
        Logger.log(`ERROR: No target folder ID found for ${rowData['fullName']}. Skipping.`);
        continue; // Skip to the next row if no valid folder ID
      }

      Logger.log(`Creating letter for ${rowData['fullName']} in folder ${targetFolderId}`);

      // Create a copy of the template document
      try {
        const templateCopy = DriveApp.getFileById("1bwuDum4IFok1ojdcsIg4Lb_vKfDlR7BHbdCZTqlkOuE")
          .makeCopy(`Offer Letter for ${rowData['fullName']}`, DriveApp.getFolderById(targetFolderId));
        
        Logger.log(`Template copy created for ${rowData['fullName']}`);

        const doc = DocumentApp.openById(templateCopy.getId());
        let body = doc.getBody();

        // Replace placeholders in the document
        headers.forEach(header => {
          const placeholder = `{{${header}}}`;
          if (body.findText(placeholder)) {
            body.replaceText(placeholder, rowData[header] || '');
          }
        });

        doc.saveAndClose();
        Logger.log(`Placeholders replaced for ${rowData['fullName']}`);

        // Convert the document to PDF
        const pdfFile = DriveApp.getFileById(templateCopy.getId()).getAs('application/pdf');
        const pdf = DriveApp.getFolderById(targetFolderId).createFile(pdfFile);
        pdf.setName(`Offer Letter: ${rowData['fullName']}`);

        Logger.log(`PDF created for ${rowData['fullName']} and saved in folder ${targetFolderId}`);

        // Delete the temporary document copy
        DriveApp.getFileById(templateCopy.getId()).setTrashed(true);
        Logger.log(`Temporary document copy trashed for ${rowData['fullName']}`);

        // Update the 'letterTemplate' column with the download URL
        sheet.getRange(i + 1, agreementIndex + 1).setValue(pdf.getDownloadUrl());
        Logger.log(`'letterTemplate' column updated with PDF URL for ${rowData['fullName']}`);

        // Collect result details
        results.push({
          fileId: pdf.getId(),
          folderId: targetFolderId,
          viewUrl: pdf.getUrl(),
          downloadUrl: pdf.getDownloadUrl(),
          fileName: pdf.getName()
        });
      } catch (error) {
        Logger.log(`ERROR: Failed to create PDF for ${rowData['fullName']}: ${error.message}`);
      }
    }
  }

  Logger.log("Finished processing all rows.");
  return results;
}
