/*
 GeminiApp

 Copyright (c) 2023 Martin Hawksey

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 
 Based on: 

 ChatGPTApp
 https://github.com/scriptit-fr/ChatGPTApp
 
 Copyright (c) 2023 Guillemine Allavena - Romain Vialard
 
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
const GeminiApp = (function () {
  let PROJECT_ID = "";
  let REGION = "";
  let verbose = true;

  /**
   * @class
   * Class representing a function known by function calling model
   */
  class FunctionObject {

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

  /**
   * @class
   * Class representing a chat.
   */
  class Chat {
    constructor() {
      let contents = [];
      let functions = [];
      let payload = {};
      let temperature = 0.9;
      let sequences = [];
      let candidates = 1;
      let max_output_tokens = 8192;

      /**
       * Add a content to the chat.
       * @param {string} textPrompt - The content to be added.
       * @param {boolean} [model] - OPTIONAL - True if content from model, False for user. 
       * @returns {Chat} - The current Chat instance.
       */
      this.addContent = function (textPrompt, model) {
        let role = "user";
        if (model) {
          role = "model";
        }
        contents.push({
          role: role,
          parts: [{ text: textPrompt }]
        });
        return this;
      };

      /**
       * Add a function to the chat.
       * @param {FunctionObject} functionObject - The function to be added.
       * @returns {Chat} - The current Chat instance.
       */
      this.addFunction = function (functionObject) {
        functions.push(functionObject);
        return this;
      };

      /**
       * Get the messages of the chat.
       * returns {string[]} - The messages of the chat.
       */
      this.getMessages = function () {
        return JSON.stringify(messages);
      };

      /**
       * Get the functions of the chat.
       * returns {FunctionObject[]} - The functions of the chat.
       */
      this.getFunctions = function () {
        return JSON.stringify(functions);
      };

      /**
       * Disable logs generated by this library
       * @returns {Chat} - The current Chat instance.
       */
      this.disableLogs = function (bool) {
        if (bool) {
          verbose = false;
        }
        return this;
      };

      this.toJson = function () {
        return {
          messages: messages,
          functions: functions,
          temperature: temperature,
          max_output_tokens: max_output_tokens,
        };
      };

      /**
       * Start the chat conversation.
       * Sends all your messages and eventual function to chat GPT.
       * Will return the last chat answer.
       * If a function calling model is used, will call several functions until the chat decides that nothing is left to do.
       * @param {{temperature?: number, max_output_tokens?: number}} [advancedParametersObject] - OPTIONAL - For more advanced settings and specific usage only. {temperature, max_output_tokens}
       * @returns {object} - the last message of the chat 
       */
      this.run = function (advancedParametersObject) {
        if (!(REGION || PROJECT_ID)) {
          throw Error("Please set your Vertex AI project and region using GeminiApp.init(location, project)");
        }
        if (advancedParametersObject) {
          if (advancedParametersObject.temperature) {
            temperature = advancedParametersObject.temperature;
          }
          if (advancedParametersObject.max_output_tokens) {
            max_output_tokens = advancedParametersObject.max_output_tokens;
          }
        }

        payload.generationConfig = {
          "temperature": temperature,
          "candidateCount": candidates,
          "maxOutputTokens": max_output_tokens,
          "stopSequences": sequences
        }
        payload.contents = contents;

        let functionCalling = false;

        if (functions.length >> 0) {
          // the user has added functions, enable function calling
          functionCalling = true;
          let payloadFunctions = Object.keys(functions).map(f => ({
            name: functions[f].toJSON().name,
            description: functions[f].toJSON().description,
            parameters: functions[f].toJSON().parameters
          }));
          payload.tools = [];
          payload.tools.push({ function_declarations: payloadFunctions });

        }

        let maxRetries = 5;
        let retries = 0;
        let success = false;

        let responseMessage, responseParts, functionObj, finish_reason;
        while (retries < maxRetries && !success) {
          let options = {
            'method': 'POST',
            'headers': { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
            'contentType': 'application/json',
            'payload': JSON.stringify(payload),
            'muteHttpExceptions': true
          };
          let response = UrlFetchApp.fetch(`https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/gemini-pro:streamGenerateContent`, options);
          let responseCode = response.getResponseCode();

          if (responseCode === 200) {
            // The request was successful, exit the loop.
            const parsedResponse = JSON.parse(response.getContentText());
            responseMessage = parsedResponse[0].candidates[0];
            responseParts = responseMessage.content.parts;
            finish_reason = responseMessage.finishReason;
            if (finish_reason == "MAX_TOKENS") {
              console.warn(`Gemini response has been troncated because it was too long. To resolve this issue, you can increase the max_output_tokens property. max_output_tokens: ${max_output_tokens}, prompt_tokens: ${parsedResponse[0].usageMetadata.promptTokenCount}, completion_tokens: ${parsedResponse[0].usageMetadata.totalTokenCount}`);
            }
            success = true;
          }
          else if (responseCode === 429) {
            console.warn(`Rate limit reached when calling Gemini API, will automatically retry in a few seconds.`);
            // Rate limit reached, wait before retrying.
            let delay = Math.pow(2, retries) * 1000; // Delay in milliseconds, starting at 1 second.
            Utilities.sleep(delay);
            retries++;
          }
          else if (responseCode === 503) {
            // The server is temporarily unavailable, wait before retrying.
            let delay = Math.pow(2, retries) * 1000; // Delay in milliseconds, starting at 1 second.
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

        if (verbose) {
          console.log('Got response from Gemini API');
        }

        if (functionCalling) {
          // Check if Gemini wanted to call a function
          if (responseParts[0].functionCall) {
            // Call the function
            let functionName = responseParts[0].functionCall.name;
            let functionArgs = responseParts[0].functionCall.args;

            let argsOrder = [];
            let endWithResult = false;
            let onlyReturnArguments = false;

            for (let f in functions) {
              let currentFunction = functions[f].toJSON();
              if (currentFunction.name == functionName) {
                argsOrder = currentFunction.argumentsInRightOrder; // get the args in the right order
                endWithResult = currentFunction.endingFunction;
                onlyReturnArguments = currentFunction.onlyArgs;
                break;
              }
            }

            if (endWithResult) {
              let functionResponse = callFunction(functionName, functionArgs, argsOrder);
              if (typeof functionResponse === "string") {
                functionResponse = { text: functionResponse };
              }
              if (verbose) {
                console.log("Conversation stopped because end function has been called");
              }
              return responseMessage;;
            }
            else if (onlyReturnArguments) {
              if (verbose) {
                console.log("Conversation stopped because argument return has been enabled - No function has been called");
              }
              return functionArgs;
            }
            else {
              let functionResponse = callFunction(functionName, functionArgs, argsOrder);
              if (typeof functionResponse === "string") {
                functionResponse = { content: functionResponse };
              }

              if (verbose) {
                console.log(`function ${functionName}() called by Gemini.`);
              }

              functionObj = {
                "name": functionName,
                "args": functionArgs
              };

              // Inform the chat that the function has been called
              contents.push({
                "role": "model",
                "parts": [{
                  "functionCall": functionObj
                }]
              });

              contents.push({
                "role": "function",
                "parts": [{
                  "functionResponse": {
                    "name": functionName,
                    "response": functionResponse
                  }
                }]
              });
            }
            if (advancedParametersObject) {
              return this.run(advancedParametersObject);
            }
            else {
              return this.run();
            }
          }
          else {
            // if no function has been found, stop here
            return responseMessage;
          }
        }
        else {
          return responseMessage;
        }
      }
    }
  }

  function callFunction(functionName, jsonArgs, argsOrder) {
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

  return {
    /**
     * Create a new chat.
     * @params {string} apiKey - Your Gemini API key.
     * @returns {Chat} - A new Chat instance.
     */
    newChat: function () {
      return new Chat();
    },

    /**
     * Create a new function.
     * @returns {FunctionObject} - A new Function instance.
     */
    newFunction: function () {
      return new FunctionObject();
    },

    /**
     * Mandatory
     * @param {string} apiKey - Your Gemini API key.
     */
    init: function (location, project) {
      REGION = location;
      PROJECT_ID = project
    }
  }
})();