// Here is where you define your Google Cloud Project details. Use Google Cloud IAM settings to add additional testers 
var process = {
    env: {
      'PROJECT_ID': 'your-cloud-project-id',
      'VERTEX_AI_LOCATION_ID': 'us-central1',
    }
  }

/**
 * Orchestrates the sending of personalized coding tips via email using Gemini and Apps Script functions.
 *
 * @function sendCodingTipsByEmailGemini
 */
function sendCodingTipsByEmailGemini() {
    GeminiApp.init(process.env.VERTEX_AI_LOCATION_ID, process.env.PROJECT_ID);

    var getContactList = GeminiApp.newFunction()
        .setName("getContactList")
        .setDescription("Retrieve a list of contacts, including their name, email address and tip topic from the values in a 2D Array format with a header in row 1");

    var sendMessageFunction = GeminiApp.newFunction()
        .setName("sendMessage")
        .setDescription("Send an email to a list of contacts")
        .addParameter("recipientEmail", "STRING", "The email address of the recipient")
        .addParameter("subject", "STRING", "The email subject")
        .addParameter("body", "STRING", "The email body in Markdown format (e.g. CommonMark or GitHub Flavored Markdown (GFM))");

    var resp = GeminiApp.newChat()
        .addContent(`Send a useful personalised Google Apps Script coding tip for each of my contacts using the suggested tip topic from my Google Sheet data. You must provide responses to sendMessage until there are no email addresses left in the Google Sheet data. The tip message must be over 400 words`)
        .addFunction(getContactList)
        .addFunction(sendMessageFunction)
        .run({ temperature: 0.4 });

    console.log(resp.content.parts[0].text);
}

/**
 * Retrieves a list of contacts from the first sheet of the active spreadsheet.
 *
 * @returns {Object} A dictionary containing the following key-value pair:
 *   * `values` (list of lists): A list of lists, where each sub-list represents a row in the spreadsheet and each element in the sub-list represents a cell value.
 */
function getContactList() {
    const data = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getDataRange().getValues();
    console.log(JSON.stringify({ values: data }))
    return { values: data }
}

/**
 * Sends an email using Gmail with Markdown formatting, handling potential errors.
 *
 * @function sendMessage
 * @param {string} recipientEmail - The email address of the recipient.
 * @param {string} subject - The subject of the email.
 * @param {string} body - The body of the email in Markdown format.
 * @returns {object} An object with status and text properties:
 *   - status: {string} Either 'ok' for success or 'error' for failure.
 *   - text: {string} A message confirming delivery or indicating an error.
 */
function sendMessage(recipientEmail, subject, body) {
    try {
        const htmlBody = markdownToHTML(body);
        MailApp.sendEmail(recipientEmail, subject, body, {
            htmlBody: htmlBody
        });
        console.log(`sendMessage: Email sent to ${recipientEmail}`);
        return { status: 'ok', text: `sendMessage: Email sent to ${recipientEmail}` };
    } catch (e) {
        console.error(e)
        return { status: 'error', text: `sendMessage: Error sending email sent to ${recipientEmail}` };
    }
}

/**
 * Converts Markdown text to HTML using the Showdown library.
 *
 * @function markdownToHTML
 * @param {string} text - The Markdown text to be converted.
 * @returns {string} The converted HTML text.
 */
function markdownToHTML(text) {
    const converter = new showdown.Converter();
    text = text.replace(/\\"/g, '"').split('\\n').join('\n');
    return converter.makeHtml(text);
}