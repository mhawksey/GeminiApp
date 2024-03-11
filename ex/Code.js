// Here is where you define your Google Cloud Project details. Use Google Cloud IAM settings to add additional testers 
var process = {
    env: {
        'PROJECT_ID': 'your-cloud-project-id',
        'VERTEX_AI_LOCATION_ID': 'us-central1',
    }
}

/**
 * Add menu option
 */
function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('GeminiApp')
        .addItem('Create Drafts', 'draftCodingTipsByEmail')
        .addToUi();
}

/**
 * Orchestrates the drafting a personalized tips using Gemini and Apps Script functions.
 *
 * @function draftCodingTipsByEmailGemini
 */
function draftCodingTipsByEmail() {
    GeminiApp.init(process.env.VERTEX_AI_LOCATION_ID, process.env.PROJECT_ID);

    var getContactList = GeminiApp.newFunction()
        .setName("getContactList")
        .setDescription("Retrieve a contact list as a 2D data array. The contact list including one row per person with their name, email address, company and tip topic. The header row defines the different columns of data.");

    var draftMessageFunction = GeminiApp.newFunction()
        .setName("draftMessage")
        .setDescription("Draft an email to a contact")
        .addParameter("recipientEmail", "STRING", "The email address of the recipient")
        .addParameter("subject", "STRING", "The email subject")
        .addParameter("body", "STRING", "The email body in Markdown format (e.g. CommonMark or GitHub Flavored Markdown (GFM))");

    var resp = GeminiApp.newChat()
        .addContent('Send a useful personalised tip for each of my contacts using the suggested topic in my contact list. You must provide responses to draftMessage until there are no email addresses left in the contact list. The tip message must be over 500 words. Each tip email must be different')
        .addFunction(getContactList)
        .addFunction(draftMessageFunction)
        .run({ temperature: 0.1 });

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
function draftMessage(recipientEmail, subject, body) {
    try {
        const htmlBody = markdownToHTML_(body);
        GmailApp.createDraft(recipientEmail, subject, body, {
            htmlBody: htmlBody
        });
        console.log(`sendMessage: Email sent to ${recipientEmail}`);
        return { status: 'ok', text: `draftMessage: Email drafted for ${recipientEmail}` };
    } catch (e) {
        console.error(e)
        return { status: 'error', text: `draftMessage: Error drafting email for ${recipientEmail}` };
    }
}

/**
 * Converts Markdown text to HTML using the Showdown library.
 *
 * @function markdownToHTML
 * @param {string} text - The Markdown text to be converted.
 * @returns {string} The converted HTML text.
 */
function markdownToHTML_(text) {
    text = text.split(/\\\n/).join('\n');
    text = text.split(/\\n/).join('\n').replace(/\\"/g, '"').replace(/\\/g, "");
    const converter = new showdown.Converter();
    return converter.makeHtml(text);
}