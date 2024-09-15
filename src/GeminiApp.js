/**
 * This library includes software components derived from the following projects:
 * [ChatGPTApp] (https://github.com/scriptit-fr/ChatGPTApp)
 * [Google AI JavaScript SDK] (https://github.com/google/generative-ai-js/)
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

/**
 * CoreFunctions for GenerativeModel and Chat.
 */
class _CoreFunctions {
  constructor() {
  }

  _countTokens(auth, model, params) {
    const url = new RequestUrl(model, Task.COUNT_TOKENS, auth, false, {});
    const response = this._makeRequest(
      url,
      JSON.stringify({ ...params, model })
    );
    return response;
  };

  _generateContent(auth, model, params, requestOptions) {
    const url = new RequestUrl(
      model,
      Task.GENERATE_CONTENT,
      auth,
    /* stream */ false,
      requestOptions
    );
    const responseJson = this._makeRequest(
      url,
      JSON.stringify(params)
    );
    return { response: this._addHelpers(responseJson) };
  };

  _makeRequest(
    url,
    body
  ) {

    const maxRetries = 5;
    let retries = 0;
    let success = false;

    let options = {
      'method': 'POST',
      'contentType': 'application/json',
      'muteHttpExceptions': true,
      'headers': {},
      'payload': body
    };

    if (url.apiKey) {
      options.headers = { 'X-Goog-Api-Key': url.apiKey };
    } else if (url._auth?.type === 'service_account') {
      const credentials = this._credentialsForVertexAI(url._auth);
      options.headers = { 'Authorization': `Bearer ${credentials.accessToken}` }
    } else {
      options.headers = { 'Authorization': `Bearer ${ScriptApp.getOAuthToken()}` };
    }

    let response;
    while (retries < maxRetries && !success) {
      response = UrlFetchApp.fetch(url, options);
      let responseCode = response.getResponseCode();

      if (responseCode === 200) {
        // The request was successful, exit the loop.
        response = JSON.parse(response.getContentText());
        success = true;
      }
      else if (responseCode === 429) {
        // Rate limit reached, wait before retrying.
        let delay = Math.pow(2, retries) * 1000; // Delay in milliseconds, starting at 1 second.
        console.warn(`Rate limit reached when calling Gemini API, automatically retrying in ${delay/1000} seconds.`);
        Utilities.sleep(delay);
        retries++;
      }
      else if (responseCode >= 500) {
        // The server is temporarily unavailable, wait before retrying.
        let delay = Math.pow(2, retries) * 1000; // Delay in milliseconds, starting at 1 second.
        console.warn(`Gemini API returned ${responseCode} error, automatically retrying in ${delay/1000} seconds.`);
        Utilities.sleep(delay);
        retries++;
      }
      else {
        // The request failed for another reason, log the error and exit the loop.
        console.error(`Request to Gemini failed with response code ${responseCode} - ${response.getContentText()}`);
        break;
      }
    }

    if (!success) {
      throw new Error(`Failed to call Gemini API after ${retries} retries.`);
    }
    return response
  };

  // @See https://github.com/googleworkspace/slides-advisor-add-on/blob/main/src/ai.js
  _credentialsForVertexAI(auth) {
    try {
      const service = OAuth2.createService("Vertex")
        .setTokenUrl('https://oauth2.googleapis.com/token')
        .setPrivateKey(auth.private_key)
        .setIssuer(auth.client_email)
        .setPropertyStore(PropertiesService.getScriptProperties())
        .setCache(CacheService.getScriptCache())
        .setScope("https://www.googleapis.com/auth/cloud-platform");
      return { accessToken: service.getAccessToken() }
    } catch(e) {
      console.error(e)
    }
  }

/**
 * Import from https://github.com/google/generative-ai-js/blob/main/packages/main/src/requests/request-helpers.ts
 */

  _formatGenerateContentInput(params) {
    if (params.contents) {
      return params
    } else {
      const content = this._formatNewContent(params)
      return { contents: [content] }
    }
  }

  _formatNewContent(request) {
    let newParts = [];
    if (typeof request === "string") {
      newParts = [{ text: request }]
    } else {
      for (const partOrString of request) {
        if (typeof partOrString === "string") {
          newParts.push({ text: partOrString })
        } else {
          newParts.push(partOrString)
        }
      }
    }
    return this._assignRoleToPartsAndValidateSendMessageRequest(newParts)
  }

  _assignRoleToPartsAndValidateSendMessageRequest(parts) {
    const userContent = { role: "user", parts: [] }
    const functionContent = { role: "function", parts: [] }
    let hasUserContent = false
    let hasFunctionContent = false
    for (const part of parts) {
      if ("functionResponse" in part) {
        functionContent.parts.push(part)
        hasFunctionContent = true
      } else {
        userContent.parts.push(part)
        hasUserContent = true
      }
    }

    if (hasUserContent && hasFunctionContent) {
      throw new Error(
        "Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message."
      )
    }

    if (!hasUserContent && !hasFunctionContent) {
      throw new Error(
        "No content is provided for sending chat message."
      )
    }

    if (hasUserContent) {
      return userContent
    }

    return functionContent
  }

  _addHelpers(response) {
    if (response.candidates && response.candidates.length > 0) {
      if (response.candidates.length > 1) {
        console.warn(
          `This response had ${response.candidates.length} ` +
          `candidates. Returning text from the first candidate only. ` +
          `Access response.candidates directly to use the other candidates.`
        )
      }
      if (response.candidates[0].finishReason === "MAX_TOKENS") {
        console.warn(
          `Gemini response has been troncated because it was too long. To resolve this issue, you can increase the maxOutputTokens property.`
        );

      }
      if (this._hadBadFinishReason(response.candidates[0])) {
        throw new Error(
          `${this._formatBlockErrorMessage(response)}`,
          response
        )
      }
    } else if (response.promptFeedback) {
      throw new Error(
        `Text not available. ${this._formatBlockErrorMessage(response)}`,
        response
      )
    }

    response.text = function () {
      if (response.candidates?.[0].content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts.map(({ text }) => text).join("");
      } else {
        return "";
      }
    };

    response.json = function () {
      if (response.candidates?.[0].content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts.map(({ text }) => JSON.parse(text));
      } else {
        return "";
      }
    };

    response.getFunctionCall = function () {
      if (response.candidates?.[0].content?.parts?.[0]?.functionCall) {
        return response.candidates?.[0].content?.parts?.[0]?.functionCall;
      } else {
        return "";
      }
    };

    return response
  }

  _hadBadFinishReason(candidate) {
    const badFinishReasons = [FinishReason.RECITATION, FinishReason.SAFETY, FinishReason.OTHER]
    return (
      !!candidate.finishReason &&
      badFinishReasons.includes(candidate.finishReason)
    )
  }

  _formatBlockErrorMessage(response) {
    let message = ""
    if (
      (!response.candidates || response.candidates.length === 0) &&
      response.promptFeedback
    ) {
      message += "Response was blocked"
      if (response.promptFeedback?.blockReason) {
        message += ` due to ${response.promptFeedback.blockReason}`
      }
      if (response.promptFeedback?.blockReasonMessage) {
        message += `: ${response.promptFeedback.blockReasonMessage}`
      }
    } else if (response.candidates?.[0]) {
      const firstCandidate = response.candidates[0]
      if (this._hadBadFinishReason(firstCandidate)) {
        message += `Candidate was blocked due to ${firstCandidate.finishReason}`
        if (firstCandidate.finishMessage) {
          message += `: ${firstCandidate.finishMessage}`
        }
      }
    }
    return message
  }
}

/**
 * Class representing _GoogleGenerativeAI
 * 
 * @constructor
 * @param {Object|string} options - Configuration options for the class instance.
 * @param {string} [options.apiKey] - API key for authentication.
 * @param {string} [options.region] - Region for the Vertex AI project.
 * @param {string} [options.project_id] - Project ID for the Vertex AI project
 * @param {string} [options.type] - Type of authentication (e.g., 'service_account').
 * @param {string} [options.private_key] - Private key for service account authentication.
 * @param {string} [options.client_email] - Client email for service account authentication.
 * @param {string} [options.model] - The model to use (defaults to '').
 */
class _GoogleGenerativeAI {
  constructor(options) {
    this._auth = {};
    if (typeof options === 'string') {
      this._auth.apiKey = options
    } else {
      if (options.region && options.project_id) {
        this._auth.region = options.region;
        this._auth.project_id = options.project_id;
      }
      if (options.type && options.type === "service_account") {
        this._auth.type = options.type;
        this._auth.private_key = options.private_key;
        this._auth.client_email = options.client_email;
      }
    }
    this.tools = [];
    this.model = options.model || ''
  }

  getGenerativeModel(modelParams, requestOptions) {
    if (!modelParams.model) {
      throw new Error(
        `Must provide a model name. ` +
        `Example: genai.getGenerativeModel({ model: 'my-model-name' })`
      );
    }
    return new GenerativeModel(this._auth, modelParams, requestOptions);
  }
}
/* @constructor
 * @param {Object|string} options - Configuration options for the class instance.
 * @param {string} [options.apiKey] - API key for authentication.
 * @param {string} [options.region] - Region for the Vertex AI project.
 * @param {string} [options.project_id] - Project ID for the Vertex AI project
 * @param {string} [options.type] - Type of authentication (e.g., 'service_account').
 * @param {string} [options.private_key] - Private key for service account authentication.
 * @param {string} [options.client_email] - Client email for service account authentication.
 * @param {string} [options.model] - The model to use (defaults to '').
 */
var GeminiApp = _GoogleGenerativeAI;


class _GenerativeModel extends _CoreFunctions {
  constructor(auth, modelParams, requestOptions) {
    super();
    this._auth = auth;
    this.model = this.determineModelPath(modelParams.model);
    this.generationConfig = modelParams.generationConfig || {}
    this.safetySettings = modelParams.safetySettings || []
    this.tools = modelParams.tools
    this.requestOptions = requestOptions || {}
  }

  determineModelPath(model) {
    return model.includes("/") ? model : `models/${model}`;
  }

  generateContent(request) {
    const formattedParams = super._formatGenerateContentInput(request);
    return super._generateContent(
      this._auth,
      this.model,
      {
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        tools: this.tools,
        ...formattedParams
      },
      this.requestOptions
    );
  }

  countTokens(request) {
    const formattedParams = super._formatGenerateContentInput(request);
    return super._countTokens(this._auth,
      this.model,
      formattedParams);
  }

  startChat(startChatParams) {
    return new ChatSession(
      this._auth,
      this.model,
      {
        tools: this.tools,
        ...startChatParams,
      },
      this.requestOptions,
    );
  };

  newFunction() {
    return new FunctionObject()
  }



}
var GenerativeModel = _GenerativeModel

class ChatSession extends _CoreFunctions {

  constructor(auth, model, params, requestOptions) {
    super();
    this._auth = auth;
    this._history = [];
    this._functions = [];
    this.model = model;
    this.params = params;
    this.tools = this.params?.tools || [];
    this.requestOptions = requestOptions;

    if (params && params.history) {
      this._validateChatHistory(params.history);
      this._history = params.history;
    }
  }

  /**
   * Gets the chat history so far. Blocked prompts are not added to history.
   * Blocked candidates are not added to history, nor are the prompts that
   * generated them.
   */
  getHistory() {
    return this._history
  }

  sendMessage(request, skipFormat = false) {
    const newContent = (skipFormat) ? request : super._formatNewContent(request);
    const generateContentRequest = {
      safetySettings: this.params?.safetySettings,
      generationConfig: this.params?.generationConfig,
      //tools: this.tools,
      contents: [...this._history, newContent],
    };
    if (this.tools.length) generateContentRequest.tools = this.tools;

    const result = super._generateContent(
      this._auth,
      this.model,
      generateContentRequest,
      this.requestOptions
    );

    let functionCall = result.response.getFunctionCall();
    if (this._functions.length >> 0 && functionCall) {
      this._history.push(newContent);
      // Check if Gemini wanted to call a function

      let functionParts = [];
      let functionName = functionCall.name;
      let functionArgs = functionCall.args;

      let argsOrder = [];
      let endWithResult = false;
      let onlyReturnArguments = false;

      for (let f in this._functions) {
        let currentFunction = this._functions[f].toJSON();
        if (currentFunction.name == functionName) {
          argsOrder = currentFunction.argumentsInRightOrder; // get the args in the right order
          endWithResult = currentFunction.endingFunction;
          onlyReturnArguments = currentFunction.onlyArgs;
          break;
        }
      }

      if (endWithResult) {
        let functionResponse = this._callFunction(functionName, functionArgs, argsOrder);
        if (typeof functionResponse === "string") {
          functionResponse = { text: functionResponse };
        }
        return result;
      } else if (onlyReturnArguments) {
        return functionArgs;
      } else {
        let functionResponse = this._callFunction(functionName, functionArgs, argsOrder);
        if (typeof functionResponse === "string") {
          functionResponse = { content: functionResponse };
        }

        // Inform the chat that the function has been called
        functionParts.push({
          "role": "model",
          "parts": [{
            "functionCall": {
              "name": functionName,
              "args": functionArgs
            }
          }]
        });

        functionParts.push({
          "role": "function",
          "parts": [{
            "functionResponse": {
              "name": functionName,
              "response": functionResponse
            }
          }]
        });
      }
      return this.sendMessage(functionParts, true)
    } else if (
      result.response.candidates &&
      result.response.candidates.length > 0
    ) {
      this._history.push(newContent);
      const responseContent = {
        parts: [],
        role: "model",
        ...result.response.candidates?.[0].content,
      };
      this._history.push(responseContent);
    } else {
      const blockErrorMessage = super._formatBlockErrorMessage(result.response);
      if (blockErrorMessage) {
        console.warn(
          `sendMessage() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`,
        );
      }
    }
    let finalResult = result;

    return finalResult;
  }

  addFunction(functionObject) {
    this._functions.push(functionObject);

    const functionDeclaration = {
      name: functionObject.toJSON().name,
      description: functionObject.toJSON().description,
      parameters: functionObject.toJSON().parameters
    };

    const toolsFunctionObject = this.tools.find(tool => tool.hasOwnProperty("functionDeclarations"));
    if (toolsFunctionObject) {
      toolsFunctionObject.functionDeclarations.push(functionDeclaration);
    } else {
      this.tools.push({ functionDeclarations: [functionDeclaration] })
    }
    return this
  }

  _callFunction(functionName, jsonArgs, argsOrder) {
    // Parse JSON arguments
    var argsObj = jsonArgs;
    let argsArray = argsOrder.map(argName => argsObj[argName]);

    // Call the function dynamically
    if (globalThis[functionName] instanceof Function) {
      let functionResponse = globalThis[functionName].apply(null, argsArray);
      if (functionResponse) {
        return functionResponse;
      }
      else {
        return "the function has been sucessfully executed but has nothing to return";
      }
    }
    else {
      throw Error("Function not found or not a function: " + functionName);
    }
  }

  _validateChatHistory(history) {
    let prevContent;
    for (const currContent of history) {
      const { role, parts } = currContent;
      if (!prevContent && role !== "user") {
        throw new Error(
          `First content should be with role 'user', got ${role}`
        );
      }
      if (!POSSIBLE_ROLES.includes(role)) {
        throw new Error(
          `Each item should include role field. Got ${role} but valid roles are: ${JSON.stringify(
            POSSIBLE_ROLES
          )}`
        );
      }

      if (!Array.isArray(parts)) {
        throw new Error(
          "Content should have 'parts' property with an array of Parts"
        );
      }

      if (parts.length === 0) {
        throw new Error("Each Content should have at least one part");
      }

      const countFields = {
        text: 0,
        inlineData: 0,
        functionCall: 0,
        functionResponse: 0,
      };

      for (const part of parts) {
        for (const key of VALID_PART_FIELDS) {
          if (key in part) {
            countFields[key] += 1;
          }
        }
      }
      const validParts = VALID_PARTS_PER_ROLE[role];
      for (const key of VALID_PART_FIELDS) {
        if (!validParts.includes(key) && countFields[key] > 0) {
          throw new Error(
            `Content with role '${role}' can't contain '${key}' part`
          );
        }
      }

      if (prevContent) {
        const validPreviousContentRoles = VALID_PREVIOUS_CONTENT_ROLES[role];
        if (!validPreviousContentRoles.includes(prevContent.role)) {
          throw new Error(
            `Content with role '${role}' can't follow '${prevContent.role}'. Valid previous roles: ${JSON.stringify(
              VALID_PREVIOUS_CONTENT_ROLES
            )}`
          );
        }
      }
      prevContent = currContent;
    }
  }
}

/**
 * import from https://github.com/google/generative-ai-js/blob/main/packages/main/src/requests/request.ts
 */
var BASE_URL_STUDIO = "https://generativelanguage.googleapis.com";
var BASE_URL_VERTEX = "https://{REGION}-aiplatform.googleapis.com/{apiVersion}/projects/{PROJECT_ID}/locations/{REGION}/publishers/google";
var DEFAULT_API_VERSION = "v1";

/**
 * import from https://github.com/google/generative-ai-js/blob/main/packages/main/types/enums.ts
 */
const POSSIBLE_ROLES = ["user", "model", "function"];


/**
 * Harm categories that would cause prompts or candidates to be blocked.
 * @public
 */
const HarmCategory = Object.freeze({
  HARM_CATEGORY_UNSPECIFIED: "HARM_CATEGORY_UNSPECIFIED",
  HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
  HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
  HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
});

/**
 * Threshold above which a prompt or candidate will be blocked.
 * @public
 */
const HarmBlockThreshold = Object.freeze({
  HARM_BLOCK_THRESHOLD_UNSPECIFIED: "HARM_BLOCK_THRESHOLD_UNSPECIFIED",
  BLOCK_LOW_AND_ABOVE: "BLOCK_LOW_AND_ABOVE",
  BLOCK_MEDIUM_AND_ABOVE: "BLOCK_MEDIUM_AND_ABOVE",
  BLOCK_ONLY_HIGH: "BLOCK_ONLY_HIGH",
  BLOCK_NONE: "BLOCK_NONE",
});

/**
 * Probability that a prompt or candidate matches a harm category.
 * @public
 */
const HarmProbability = Object.freeze({
  HARM_PROBABILITY_UNSPECIFIED: "HARM_PROBABILITY_UNSPECIFIED",
  NEGLIGIBLE: "NEGLIGIBLE",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
});

/**
 * Reason that a prompt was blocked.
 * @public
 */
const BlockReason = Object.freeze({
  BLOCKED_REASON_UNSPECIFIED: "BLOCKED_REASON_UNSPECIFIED",
  SAFETY: "SAFETY",
  OTHER: "OTHER",
});

const Task = Object.freeze({
  GENERATE_CONTENT: "generateContent",
  STREAM_GENERATE_CONTENT: "streamGenerateContent",
  COUNT_TOKENS: "countTokens",
  EMBED_CONTENT: "embedContent",
  BATCH_EMBED_CONTENTS: "batchEmbedContents"
});

const FinishReason = Object.freeze({
  FINISH_REASON_UNSPECIFIED: "FINISH_REASON_UNSPECIFIED",
  STOP: "STOP",
  MAX_TOKENS: "MAX_TOKENS",
  SAFETY: "SAFETY",
  RECITATION: "RECITATION",
  OTHER: "OTHER"
});

const VALID_PART_FIELDS = [
  "text",
  "inlineData",
  "functionCall",
  "functionResponse",
];

const VALID_PARTS_PER_ROLE = Object.freeze({
  user: ["text", "inlineData"],
  function: ["functionResponse"],
  model: ["text", "functionCall"],
});

const VALID_PREVIOUS_CONTENT_ROLES = Object.freeze({
  user: ["model"],
  function: ["model"],
  model: ["user", "function"],
});


class RequestUrl {
  constructor(model, task, auth, stream = false, requestOptions) {
    this.model = model;
    this.task = task;
    this._auth = auth;
    this.apiKey = auth.apiKey ?? '';
    this.stream = stream;
    this.requestOptions = requestOptions;
  }
  toString() {
    let url = '';
    const apiVersion = this.requestOptions?.apiVersion || DEFAULT_API_VERSION;

    if (this._auth.region && this._auth.project_id) {
      const replacementMap = { REGION: this._auth.region, PROJECT_ID: this._auth.project_id, apiVersion: apiVersion }
      url = BASE_URL_VERTEX.replace(/\{(\w+)\}/g, (match, key) => replacementMap[key] || match) + `/${this.model}:${this.task}`;
    } else {
      url = `${BASE_URL_STUDIO}/${apiVersion}/${this.model}:${this.task}`
    }
    // if (this.stream) {
    //   url += "?alt=sse"
    // }
    return url
  }
}

/**
  * @class
  * Class representing a function known by function calling model
  */
class _FunctionObject {
  constructor() {
    let name = '';
    let description = '';
    let properties = {};
    let parameters = {};
    let required = [];
    let argumentsInRightOrder = [];
    let endingFunction = false;
    let onlyArgs = false;

    /**
     * Sets the name of a function.
     * @param {string} nameOfYourFunction - The name to set for the function.
     * @returns {FunctionObject} - The current Function instance.
     */
    this.setName = function (nameOfYourFunction) {
      name = nameOfYourFunction;
      return this;
    };

    /**
     * Sets the description of a function.
     * @param {string} descriptionOfYourFunction - The description to set for the function.
     * @returns {FunctionObject} - The current Function instance.
     */
    this.setDescription = function (descriptionOfYourFunction) {
      description = descriptionOfYourFunction;
      return this;
    };

    /**
     * OPTIONAL
     * If enabled, the conversation with the chat will automatically end when this function is called.
     * Default : false, eg the function is sent to the chat that will decide what the next action shoud be accordingly. 
     * @param {boolean} bool - Whether or not you wish for the option to be enabled. 
     * @returns {FunctionObject} - The current Function instance.
     */
    this.endWithResult = function (bool) {
      if (bool) {
        endingFunction = true;
      }
      return this;
    }

    /**
     * Adds a property (an argument) to the function.
     * Note: Parameters are required by default. Set 'isOptional' to true to make a parameter optional.
     *
     * @param {string} name - The property name.
     * @param {string} type - The property type.
     * @param {string} description - The property description.
     * @param {boolean} [isOptional] - To set if the argument is optional (default: false).
     * @returns {FunctionObject} - The current Function instance.
     */
    this.addParameter = function (name, type, description, isOptional = false) {
      let itemsType;

      if (String(type).includes("Array")) {
        let startIndex = type.indexOf("<") + 1;
        let endIndex = type.indexOf(">");
        itemsType = type.slice(startIndex, endIndex);
        type = "array";
      }

      properties[name] = {
        type: type,
        description: description
      };

      if (type === "array") {
        if (itemsType) {
          properties[name]["items"] = {
            type: itemsType
          }
        }
        else {
          throw Error("Please precise the type of the items contained in the array when calling addParameter. Use format Array.<itemsType> for the type parameter.");
          return
        }
      }

      argumentsInRightOrder.push(name);
      if (!isOptional) {
        required.push(name);
      }
      return this;
    }

    this.addParameters = function (params) {
      parameters = params;
      return this;
    }

    /**
     * OPTIONAL
     * If enabled, the conversation will automatically end when this function is called and the chat will return the arguments in a stringified JSON object.
     * Default : false
     * @param {boolean} bool - Whether or not you wish for the option to be enabled. 
     * @returns {FunctionObject} - The current Function instance.
     */
    this.onlyReturnArguments = function (bool) {
      if (bool) {
        onlyArgs = true;
      }
      return this;
    }

    this.toJSON = function () {
      const jsonArgs = {
        name: name,
        description: description,
        argumentsInRightOrder: argumentsInRightOrder,
        endingFunction: endingFunction,
        onlyArgs: onlyArgs
      };
      if (parameters.type) {
        jsonArgs.parameters = parameters
      } else {
        jsonArgs.parameters = {
          type: "OBJECT",
          properties: properties,
          required: required,
          //nullable: false
        }
      }
      return jsonArgs;
    }
  }
}
var FunctionObject = _FunctionObject;
