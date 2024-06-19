/**
 * Processes an image with a given prompt using the Gemini API.
 *
 * @param {string} [prompt=""] - The prompt to use for image processing. The prompt is appended with instructions to return a JSON object containing the response text and a short image description.
 * @param {string} imagePath - The image filename, of the image on Google Drive.
 * @param {string} filePath - The pdf filename, of the pdf on Google Drive.
 * @param {number} temp - The temperature parameter for the Gemini model.
 * @returns {object} - A JSON object containing the response text and a short image description.
 */
function processImage(prompt = "", imagePath, filePath, temp) {
    try {
      console.time('processFile');
      prompt = `${prompt} 
              Return the data as a JSON object with the response text and a short image description. The image description must be no more than 100 character. The response text can include markdown formating and must be over 500 words. Use the following structure: 
              {responseText: 'Prompt response here', shortName: 'short image description (no more than 100 character) here'}`
  
      const credentials = PropertiesService.getScriptProperties().getProperty("SERVICE_ACCOUNT_KEY");
      const parsedCredentials = JSON.parse(credentials);
  
      const genAI = new GeminiApp({
        region: 'us-central1', ...parsedCredentials
      });
  
      const fileId = getFirstFileByName_(imagePath || filePath);
  
      const generationConfig = {
        'maxOutputTokens': 2048,
        'temperature': temp,
        'responseMimeType': 'application/json'
      }
  
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig });
  
      const fileParts = [
        fileToGenerativePart_(fileId),
      ];
  
      const result = model.generateContent([prompt, ...fileParts]);
      const response = result.response;
      console.log(response.json());
      console.timeEnd('processFile');
      return response.json()[0];
    } catch (e) {
      return { responseText: e.message, shortName: 'Oops something went wrong' }
    }
  }
  
  /**
   * Processes a text prompt using the Gemini API.
   *
   * @param {string} [prompt=""] - The text prompt to process. The prompt is appended with instructions to return a JSON object containing the response text and a short description. 
   * @param {number} [temp=1] - The temperature parameter for the Gemini model.
   * @returns {object} - A JSON object containing the response text and a short description.
   */
  function processText(prompt = "", temp = 1) {
    try {
      console.time('processText');
      prompt = `${prompt} 
              Return the data as a JSON object with the response text and a short image description. The image description must be no more than 100 character. The response text can include markdown formating and must be over 500 words. Use the following structure: 
              {responseText: 'Prompt response here', shortName: 'short image description (no more than 100 character) here'}`
  
      const credentials = PropertiesService.getScriptProperties().getProperty("SERVICE_ACCOUNT_KEY");
      const parsedCredentials = JSON.parse(credentials);
  
      const genAI = new GeminiApp({
        region: 'us-central1', ...parsedCredentials
      });
  
      const generationConfig = {
        'maxOutputTokens': 2048,
        'temperature': temp,
        'responseMimeType': 'application/json'
      }
  
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001", generationConfig });
  
      const result = model.generateContent([prompt]);
      const response = result.response;
      console.log(response.json());
      console.timeEnd('processText');
      return response.json()[0];
    } catch (e) {
      return { responseText: e.message, shortName: 'Oops something went wrong' }
    }
  }
  
  /**
   * Gets the ID of the first file with a matching name in Google Drive. 
   * Note: This function is likely intended for internal use due to the leading underscore.
   *
   * @param {string} filename - The name of the file to search for.
   * @returns {string|null} The ID of the first matching file, or null if no file is found.
   */
  function getFirstFileByName_(filePath) {
    console.time('getFirstFileByName_');
    const parts = filePath.split('/');
    const filename = parts.pop();
    const pages = Drive.Files.list({
      q: `name contains '${filename}'`,
      corpora: "allDrives",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      fields: 'files(id)',
      pageSize: 1 // Adjust if needed
    })
    console.timeEnd('getFirstFileByName_');
    if (pages.files) {
      return pages.files[0].id; // Return the first matching file 
    } else {
      return null; // No file found
    }
  }
  
  /**
   * Converts a Google Drive image file ID to a GoogleGenerativeAI.Part object.
   * @param {string} id The ID of the Google Drive image file.
   * @returns {GoogleGenerativeAI.Part} A GoogleGenerativeAI.Part object representing the image.
   */
  function fileToGenerativePart_(id) {
    const file = DriveApp.getFileById(id);
    console.log(file.getName())
    const imageBlob = file.getBlob();
    const base64EncodedImage = Utilities.base64Encode(imageBlob.getBytes())
  
    return {
      inlineData: {
        data: base64EncodedImage,
        mimeType: file.getMimeType()
      },
    };
  }