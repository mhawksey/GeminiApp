/**
 * This file includes software components derived from the following projects:
 * [Name with Intelligence] (https://github.com/googleworkspace/apps-script-samples/blob/main/ai/drive-rename/ai.js)
 * 
 * These components are licensed under the Apache License 2.0. 
 * A copy of the license can be found in the LICENSE file.
 */

/**
 * @license
 * Copyright 2024 Martin Hawksey
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const VERTEX_AI_LOCATION = PropertiesService.getScriptProperties().getProperty('project_location');
const MODEL_ID = PropertiesService.getScriptProperties().getProperty('model_id');
const SERVICE_ACCOUNT_KEY = PropertiesService.getScriptProperties().getProperty('service_account_key');

const STANDARD_PROMPT = `

 Your task is to create 3 potential document names for this content.

 Also, create a summary for this content, using 2 to 3 sentences, and don't include formatting.

 Format the response as a JSON object with the first field called names and the summary field called summary.

 The content is below:

 `;
 

/**
 * Packages prompt and necessary settings, then sends a request to
 * Vertex API. Returns the response as an JSON object extracted from the
 * Vertex API response object.
 *
 * @param prompt - String representing your prompt for Gemini AI.
 */
function getAiSummary(prompt) {

  const parsedCredentials = JSON.parse(SERVICE_ACCOUNT_KEY);

  const genAI = new GeminiApp({
    region: VERTEX_AI_LOCATION, ...parsedCredentials
  });

  const generationConfig = {
    "temperature": .2,
    "maxOutputTokens": 2048,
    "responseMimeType": "application/json" 
  }

  const model = genAI.getGenerativeModel({ model: MODEL_ID, generationConfig });

  const result = model.generateContent(`${STANDARD_PROMPT} ${prompt}`);
  return result.response.json()[0];
}
