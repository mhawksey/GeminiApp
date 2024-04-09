# GeminiApp Google Apps Script Library Documentation

The GeminiApp is a library that allows integration to Google's Gemini API in your Google Apps Script projects. It allows for mutli-modal prompts, structured conversation and function calling.

> **Acknowledgement** - this library is based on [ChatGPTApp](https://github.com/scriptit-fr/ChatGPTApp) by Guillemine Allavena and Romain Vialard at [Scriptit](https://www.scriptit.fr/) and the [Google AI JavaScript SDK](https://github.com/google/generative-ai-js/) by Google.

## Table of Contents

* [Setup](#setup)
* [Implement Common Use Cases](#implement-common-use-cases)
  * [Generate text from text-only input](#generate-text-from-text-only-input)
  * [Generate text from text-and-image input (multimodal)](#generate-text-from-text-and-image-input-multimodal)
  * [Build multi-turn conversations (chat)](#build-multi-turn-conversations-chat)
  * [Build multi-turn conversations (chat) with function calling](#build-multi-turn-conversations-chat-with-function-calling)
* [Options to control content generation](#options-to-control-content-generation)
* [Function Calling with GeminiApp](#function-calling-with-geminiapp)

## Setup

> **Important:** This library is designed for Google AI Studio and Vertex AI Gemini API. Latest product information is included on the [Vertex AI Gemini API documentation page](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini).

### Setup

#### Option 1 - Google AI Studio API Key (ideal for prototyping)
> **Important** Google AI Studio is currently available in 180+ countries, check out the [documentation to learn more](https://ai.google.dev/available_regions). Google AI Studio must only be used for prototyping with generative models. If you're not in one of these countries or territories available for Google AI Studio use Gemini Pro in Vertex AI (Option 2 & 3).

1. [Get an API Key](https://ai.google.dev/tutorials/setup).
1. Add the [GeminiApp library](src/GeminiApp.js) to your project as a new script file.
1. In your main script file you can initialize the GeminiApp library by calling the `new GeminiApp(YOUR_APKI_KEY_HERE)`:

```javascript
const genAI = new GeminiApp(YOUR_APKI_KEY_HERE);
```

#### Option 2 - Vertex AI Cloud Platform project - scoped user account (prototyping/production)

This option lets you access Gemini Pro in Vertex AI adding the account you are executing your Google Apps Script project to Google Cloud Project IAM with at least a **Vertex AI User** role.

1. [Select or create a Cloud Platform project](https://console.cloud.google.com/project).
1. [Enable the Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com).
1. In your Apps Script project settings, check Show `appsscript.json` manifest file in editor.
1. Update the `appsscript.json` file with the minimum declared `oauthScopes`:
```javascript
{
  "timeZone": "America/Denver",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```
5. Add the [GeminiApp library](src/GeminiApp.js) to your project as a new script file.
6. In your main script file you can initialize the GeminiApp library by calling the `new GeminiApp(configObject)` method providing a [supported region](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini#http_request) and Cloud project ID:


```javascript
const genAI = new GeminiApp({
    region: YOUR_PROJECT_LOCATION,
    project_id: YOUR_PROJECT_ID});
```

> **Note**: Additional users can be added to your Apps Script project by opening IAM & Admin and Granting Access to users with at least the **Vertex AI User** role 

#### Option 3 - Vertex AI Cloud Platform project - Service Account (prototyping/production)

This option lets you access Gemini in Vertex AI adding a Service Account. This let you use the Gemini API with any user that has access to your Apps Script powered solution. To use a Service Account you need to add the [OAuth2 Apps Script Library](https://github.com/googleworkspace/apps-script-oauth2) to your project.

1. [Select or create a Cloud Platform project](https://console.cloud.google.com/project).
1. [Enable the Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com).
1. Follow the instructions to [create a Service Account](https://ai.google.dev/examples/slides-advisor#create_a_service_account) and [install service account key](https://ai.google.dev/examples/slides-advisor#create_and_install_service_account_key)
1. Follow the steps to [setup the OAuth2 Apps Script Library](https://github.com/googleworkspace/apps-script-oauth2?tab=readme-ov-file#setup) in your Apps Script project.
1. Add the [GeminiApp library](src/GeminiApp.js) to your project as a new script file.
1. In your main script file you can initialize the GeminiApp library by calling the `new GeminiApp(configObject)` method providing a [supported region](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini#http_request) and Service Account key:

```javascript
const credentials = PropertiesService.getScriptProperties().getProperty("SERVICE_ACCOUNT_KEY");
const parsedCredentials = JSON.parse(credentials);

const genAI = new GeminiApp({
  region: YOUR_PROJECT_LOCATION,
  ...parsedCredentials
});

```
### Implement Common Use Cases

The following common use cases have been adapted from [Get started with the Gemini API in web apps](https://ai.google.dev/tutorials/get_started_web) and have been included here under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/) (CC-BY Google), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0)

#### Generate text from text-only input

When the prompt input includes only text, use the gemini-pro model with the generateContent method to generate text output:

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);

async function runTextOnly() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = "Write a story about a magic backpack."

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}
```

#### Generate text from text-and-image input (multimodal)
Gemini provides a multimodal model (gemini-pro-vision), so you can input both text and images. Make sure to review the image requirements for input. When the prompt input includes both text and images, use the `gemini-pro-vision` model with the generateContent method to generate text output:

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);

// Converts a Google Drive image file ID to a GoogleGenerativeAI.Part object
function fileToGenerativePart(id) {
  const file = DriveApp.getFileById(id);
  const imageBlob = file.getBlob();
  const base64EncodedImage = Utilities.base64Encode(imageBlob.getBytes())

  return {
    inlineData: {
      data: base64EncodedImage,
      mimeType: file.getMimeType()
    },
  };
}

async function runTextAndImages() {
  // For text-and-images input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const prompt = "What's different between these pictures?";

  const imageParts = [
    fileToGenerativePart("1LXeJgNhlpnpS0RBfil6Ybx7QRvfqwvEh"),
    fileToGenerativePart("1OFV88Zf5esi-Mtuap4iQyoCVeYlvIeqU"),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}
```

#### Build multi-turn conversations (chat)
Using Gemini, you can build freeform conversations across multiple turns. The library simplifies the process by managing the state of the conversation, so unlike with generateContent, you don't have to store the conversation history yourself.

To build a multi-turn conversation (like chat), use the `gemini-pro` model, and initialize the chat by calling `startChat()`. Then use `sendMessage()` to send a new user message, which will also append the message and the response to the chat history.

There are two possible options for role associated with the content in a conversation:

* `user`: the role which provides the prompts. This value is the default for `sendMessage` calls, and the function will throw an exception if a different role is passed.

* `model`: the role which provides the responses. This role can be used when calling `startChat()` with existing `history`.

> **Note**: The `gemini-pro-vision` model (for text-and-image input) is not yet optimized for multi-turn conversations. Make sure to use `gemini-pro` and text-only input for chat use cases.

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);

async function runMultiTurnChat() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hello, I have 2 dogs in my house." }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });

  const msg = "How many paws are in my house?";

  const result = await chat.sendMessage(msg);
  const response = await result.response;
  const text = response.text();
  console.log(text);

  const result2 = await chat.sendMessage('If I also have a cat, how many paws are there now?');
  const response2 = await result2.response;
  const text2 = response2.text();
  console.log(text2);
}
```

#### Build multi-turn conversations (chat) with function calling
You can provide Gemini models with descriptions of functions. The model may ask you to call a function and send back the result to help the model handle your query.

```javascript
/**
 * Multiplies an input value by 2.
*/
function double(input) {
  console.log(`Gemini has asked to call this function and double ${input}`)
  return {result: input * 2};
}

const genAI = new GeminiApp(YOUR_CONFIG)

async function basicFunctionCalling() {
  // Important: If using a Google AI Studio key the apiVersion needs to be declared as v1beta
  const model = genAI.getGenerativeModel({ model: "gemini-pro" }, { apiVersion: 'v1beta' });

  const doubleFunction = model.newFunction()
    .setName("double")
    .setDescription("Multiplies an input value by 2.")
    .addParameter("input", "NUMBER", "Input The number to double")
  
  const chat = model.startChat()
    .addFunction(doubleFunction);

  const result = await chat.sendMessage('I have 7 cats. How many cats would I have if I wanted to double the number?');
  const response = await result.response;
  const text = response.text();
  console.log(text);

}
```
If you can use `chat.getHistory()` see the sequence of events:

```javscript
console.log(JSON.stringify(chat.getHistory()))

// output
[
  {
    "role": "user",
    "parts": [
      {
        "text": "I have 7 cats. How many cats would I have if I wanted to double the number?"
      }
    ]
  },
  [
    {
      "role": "model",
      "parts": [
        {
          "functionCall": {
            "name": "double",
            "args": {
              "input": 7
            }
          }
        }
      ]
    },
    {
      "role": "function",
      "parts": [
        {
          "functionResponse": {
            "name": "double",
            "response": {
              "result": 14
            }
          }
        }
      ]
    }
  ],
  {
    "parts": [
      {
        "text": "If you wanted to double the number of cats you have, you would have 14 cats."
      }
    ],
    "role": "model"
  }
]
```

### Options to control content generation

You can control content generation by configuring model parameters and by using safety settings.

#### Configure model parameters

Every prompt you send to the model includes parameter values that control how the model generates a response. The model can generate different results for different parameter values. Learn more about Model parameters. The configuration is maintained for the lifetime of your model instance.

```javascript
const generationConfig = {
  stopSequences: ["red"],
  maxOutputTokens: 200,
  temperature: 0.9,
  topP: 0.1,
  topK: 16,
};

const model = genAI.getGenerativeModel({ model: "MODEL_NAME",  generationConfig });
```

#### Use safety settings

You can use safety settings to adjust the likelihood of getting responses that may be considered harmful. By default, safety settings block content with medium and/or high probability of being unsafe content across all dimensions. Learn more about [Safety settings](https://ai.google.dev/docs/safety_setting).

Here's how to set one safety setting:

```javascript
// ...

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

const model = genAI.getGenerativeModel({ model: "MODEL_NAME", safetySettings });
```

You can also set more than one safety setting:

```javascript
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];
```

### Function Calling with GeminiApp

Function calling lets developers create a description of a function in their code, then pass that description to a language model in a request. The response from the model includes the name of a function that matches the description and the arguments to call it with. Function calling lets you use functions as tools in generative AI applications, and you can define more than one function within a single request. Function calling returns JSON with the name of a function and the arguments to use in your code.

In GeminiApp to enable function calling you need to declare your functions to your model. The functions you declare are then added to a chat session. In the following example two functions are declared `getContactList()` which requires no parameters and `draftMessage()`, which requires `recipentEmail`, `subject` and `body`. 

> **Important**: When declaring functions the `.setDescription()` and `.addParameter()` parameter comment is optional but for the best results, we recommend that you include a description.    

```javascript
async function draftCodingTipsByEmail() {
  // assuming a Service Account is being used
  const credentials = PropertiesService.getScriptProperties().getProperty("SERVICE_ACCOUNT_KEY");
  const parsedCredentials = JSON.parse(credentials);

  const genAI = new GeminiApp({
    region: region: YOUR_PROJECT_LOCATION,,
    ...parsedCredentials
  });

  // Important: If using a Google AI Studio key the apiVersion needs to be declared as v1beta
  const model = genAI.getGenerativeModel({ model: "gemini-pro" }, { apiVersion: 'v1' });

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
```
To use function calling your decalared functions also need to exist in your Apps Script project, as these functions are executed by GeminiApp and the responses are returned to the model. For a complete example visit [Exploring Gemini API Function Calling with Google Apps Script](https://medium.com/cts-technologies/genai-for-google-workspace-exploring-gemini-api-function-calling-with-google-apps-script-part-3-028785dafe3b)

For more information : [https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/function-calling](https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/function-calling)


## Reference


### Function Object


A `FunctionObject` represents a function that can be called by the chat.


Creating a function object and setting its name to the name of an actual function you have in your script will permit the library to call your real function.


#### `setName(name)`


Sets the name of the function.


#### `setDescription(description)`


Sets the description of the function.


#### `addParameter(name, type, description, [isOptional])`


Adds a parameter to the function. Parameters are required by default. Set 'isOptional' to true to make a parameter optional.


#### `endWithResult(bool)`


If enabled, the conversation with the chat will automatically end after this function is executed.


#### `onlyReturnArguments(bool)`


If enabled, the conversation will automatically end when this function is called and the chat will return the arguments in a stringified JSON object.


#### `toJSON()`


Returns a JSON representation of the function object.


### Chat


A `Chat` represents a conversation with the chat.


#### `addFunction(functionObject)`


Add a function to the chat.
