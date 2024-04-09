// Here is where you define your access.
// @See https://github.com/mhawksey/GeminiApp?tab=readme-ov-file#setup for setup options
const genAI = new GeminiApp(YOUR_API_KEY);

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
  async function draftCodingTipsByEmail() {
    // If using Google Cloud Vertex AI change apiVersion v1beta to v1 
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }, { apiVersion: 'v1beta' });
  
    const getContactList = model.newFunction()
      .setName("getContactList")
      .setDescription("Retrieve a contact list as a 2D data array. The contact list including one row per person with their name, email address, company and tip topic. The header row defines the different columns of data.");
  
    const draftMessageFunction = model.newFunction()
      .setName("draftMessage")
      .setDescription("Draft an email to a contact")
      .addParameter("recipientEmail", "STRING", "The email address of the recipient")
      .addParameter("subject", "STRING", "The email subject")
      .addParameter("body", "STRING", "The email body in Markdown format (e.g. CommonMark or GitHub Flavored Markdown (GFM))");
  
    const chat = model.startChat()
      .addFunction(getContactList)
      .addFunction(draftMessageFunction);
  
    const msg = 'Send a useful personalised tip for each of my contacts using the suggested topic in my contact list. You must provide responses to draftMessage until there are no email addresses left in the contact list. The tip message must be over 500 words. Each tip email must be different';
  
    const result = await chat.sendMessage(msg);
    const response = await result.response;
    const text = response.text();
    console.log(text);
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
      console.log(`draftMessage: Email created for ${recipientEmail}`);
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