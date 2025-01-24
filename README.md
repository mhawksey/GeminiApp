# GeminiApp Google Apps Script Library Documentation

The GeminiApp is a comprehensive Google Apps Script library that allows integration with Google's Gemini AI models. It lets developers create sophisticated AI-powered applications directly within Google Workspace, supporting multi-modal prompts (text, images, and PDFs), structured conversations, function calling, code execution, and fine-grained control over content generation, including JSON formatting and system instructions. The library also provides advanced token management, including token counting and content caching to optimize API usage and costs.

> **Google Cloud Next '24 Demo**: For a complete personalised mail merge demo visit [Exploring Gemini API Function Calling with Google Apps Script](https://medium.com/cts-technologies/genai-for-google-workspace-exploring-gemini-api-function-calling-with-google-apps-script-part-3-028785dafe3b)

## Features

* **Core Functionality & Flexibility (Original):**
    *   **Prototyping to Production**: Seamlessly transition from an API key with Google AI Studio to cloud deployment with a service account in Vertex AI. You only need to change your initialisation configuration.
    *   **Chat and Content Creation**: Utilise the same Google examples/methods as used in the Google JavaScript SDK, with the added features of error handling and exponential backoff.
    *   **Function Calling**: Easily manage function declarations, parameter passing, and response orchestration. Helper methods simplify the process of declaring and adding functions to your calls to Gemini.

*   **Enhanced Functionality & Control (New):**
    *   **Code Execution:** Generate and execute code directly within your prompts using the `gemini-2.0-flash-exp` model. This allows the model to perform calculations and programmatic logic directly within the API call.
    *   **JSON-Controlled Generation:** Generate content in JSON format by providing a schema or having the model infer the schema from your prompt. This allows for structured outputs tailored to your application's needs.
    *   **System Instructions:** Guide the model's behavior and persona by providing system instructions during the initialization of the `GenerativeModel`.

*   **Improved Token Management & Efficiency (New):**
    *   **Token Management:** Count tokens in prompts, chat histories, and responses, including cached content, giving you granular control over your API usage and costs.
    *   **Caching:** Improve efficiency and reduce token usage by caching responses from PDF content.  This lets you process the same document multiple times without incurring the full token cost each time.

*   **Multimodal Input (Expanded):**
    *   **Multimodal Input**: Process text, images, and **PDF** files to generate rich, contextual responses. PDF support is a new feature allowing you to easily process document content.

> **Acknowledgement** - this library is based on [ChatGPTApp](https://github.com/scriptit-fr/ChatGPTApp) by Guillemine Allavena and Romain Vialard at [Scriptit](https://www.scriptit.fr/) and the [Google AI JavaScript SDK](https://github.com/google/generative-ai-js/) by Google.

## Table of Contents

<!-- TOC start -->

   * [Setup](#setup)
      + [Setup Options](#setup-options)
         - [Option 1 - Google AI Studio API Key (ideal for prototyping)](#option-1-google-ai-studio-api-key-ideal-for-prototyping)
         - [Option 2 - Vertex AI Cloud Platform project - scoped user account (prototyping/production)](#option-2-vertex-ai-cloud-platform-project-scoped-user-account-prototypingproduction)
         - [Option 3 - Vertex AI Cloud Platform project - Service Account (prototyping/production)](#option-3-vertex-ai-cloud-platform-project-service-account-prototypingproduction)
      + [Implement Common Use Cases](#implement-common-use-cases)
         - [Generate text from text-only input](#generate-text-from-text-only-input)
         - [Generate text from text-and-image input (multimodal)](#generate-text-from-text-and-image-input-multimodal)
         - [Generate text from text-and-PDF input (multimodal)](#generate-text-from-text-and-pdf-input-multimodal)
         - [Build multi-turn conversations (chat)](#build-multi-turn-conversations-chat)
         - [Build multi-turn conversations (chat) with function calling](#build-multi-turn-conversations-chat-with-function-calling)
         - [Generate and execute code](#generate-and-execute-code)
         - [JSON-Controlled Generation](#json-controlled-generation)
            * [JSON-Controlled Generation with Schema](#json-controlled-generation-with-schema)
            * [JSON-Controlled Generation with Inferred Schema](#json-controlled-generation-with-inferred-schema)
         - [Process a PDF with Caching](#process-a-pdf-with-caching)
         - [Configure model parameters](#configure-model-parameters)
         - [Use safety settings](#use-safety-settings)
      + [Function Calling with GeminiApp](#function-calling-with-geminiapp)
   * [Reference](#reference)
      + [Function Object](#function-object)

<!-- TOC end -->

## Setup

> **Important:** This library is designed for Google AI Studio and Vertex AI Gemini API. Latest product information is included on the [Vertex AI Gemini API documentation page](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini).

### Setup Options

> **Alias Support**: To make it easier to transition from Google's official examples, the library now supports initialization using both `new GeminiApp()` and `new GoogleGenerativeAI()`. You can use either constructor to create a GeminiApp instance.

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

The following common use cases have been adapted and modified from the [Google Gemini AI JavaScript SDK samples](https://github.com/google-gemini/generative-ai-js/tree/main/samples) and are included here under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). These examples demonstrate how to use the GeminiApp library for text generation, chat, code execution, multimodal interactions, JSON-controlled generation, and content caching.

**Disclaimer:** For the latest model capabilities and recommendations, please visit [Google AI Studio Models Overview](https://ai.google.dev/gemini-api/docs/models/gemini) and [Vertex AI Models](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models) depending on which setup you are using. Also, be aware that in certain situations (e.g., when using code execution with Vertex AI), you may need to specify the `apiVersion` as `v1beta`. Always refer to these resources for the most up-to-date information on model selection and API usage.

#### Generate text from text-only input

This example demonstrates how to generate text output when your prompt input contains only text.

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);

async function runTextOnly() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Write a story about a magic backpack.";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}
```

#### Generate text from text-and-image input (multimodal)

This example shows how to generate text output when your prompt input includes both text and images.

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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });

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

#### Generate text from text-and-PDF input (multimodal)

This example demonstrates how to process PDF files and generate text output when the prompt input includes both text and a PDF document.

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);

// Converts a Google Drive file ID to a GoogleGenerativeAI.Part object
function fileToGenerativePart(id) {
  const file = DriveApp.getFileById(id);
  const blob = file.getBlob();
  const base64EncodedData = Utilities.base64Encode(blob.getBytes());

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.getMimeType()
    },
  };
}

async function runPDF() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });

  const prompt = "What does the pdf file says?";

  const imageParts = [
    fileToGenerativePart("1oamLVEo47-SFqsg6ZV-Pl3xQg0iuho7nMOfOqVl8RdDFyH_gWe8"),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}
```

#### Build multi-turn conversations (chat)

This example shows how to build freeform, multi-turn conversations (chat) while the state of the conversation is managed by the library.

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);

async function runMultiTurnChat() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

This example illustrates how to enable function calling in multi-turn conversations, allowing the model to request the execution of specific functions.

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
  const model = genAI.getGenerativeModel({ model: "gemini-pro" }, { apiVersion: 'v1'});

  const doubleFunction = model.newFunction()
    .setName("double_")
    .setDescription("Multiplies an input value by 2.")
    .addParameter("input", "NUMBER", "Input The number to double")
  
  const chat = model.startChat()
    .addFunction(doubleFunction);

  const result = await chat.sendMessage('I have 7 cats. How many cats would I have if I wanted to double the number?');
  const response = await result.response;
  const text = response.text();
  console.log(text);

  console.log(JSON.stringify(chat.getHistory()))
}
```

If you use `chat.getHistory()`, you can see the sequence of events:

```javascript
console.log(JSON.stringify(chat.getHistory()))
```

#### Generate and execute code

This example demonstrates how to generate and execute code directly within the model, useful for tasks that require calculations or programmatic logic.

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);

async function codeExecutionBasic() {
    const model = genAI.getGenerativeModel(
    {
      model: "gemini-2.0-flash-exp",
      tools: [{ codeExecution: {} }],
    },
    // { apiVersion: "v1beta" } // uncomment this line if you are using vertex-ai/generative-ai/docs/multimodal/code-execution
  );

    const result = await model.generateContent(
      "What is the sum of the first 50 prime numbers? " +
      "Generate and run code for the calculation, and make sure you get " +
      "all 50.",
    );

    console.log(result.response.text());
}

async function codeExecutionRequestOverride() {
    const model = genAI.getGenerativeModel(
    {
      model: "gemini-2.0-flash-exp",
    },
    // { apiVersion: "v1beta" } // uncomment this line if you are using vertex-ai/generative-ai/docs/multimodal/code-execution
  );

    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text:
                          "What is the sum of the first 50 prime numbers? " +
                          "Generate and run code for the calculation, and make sure you " +
                          "get all 50.",
                    },
                ],
            },
        ],
        tools: [{ codeExecution: {} }],
    });

    console.log(result.response.text());
}

async function codeExecutionChat() {
    const model = genAI.getGenerativeModel(
    {
      model: "gemini-2.0-flash-exp",
      tools: [{ codeExecution: {} }],
    },
    // { apiVersion: "v1beta" } // uncomment this line if you are using vertex-ai/generative-ai/docs/multimodal/code-execution
  );

    const chat = model.startChat();

    const result = await chat.sendMessage(
      "What is the sum of the first 50 prime numbers? " +
      "Generate and run code for the calculation, and make sure you get " +
      "all 50.",
    );

    console.log(result.response.text());
}
```

#### JSON-Controlled Generation

These examples show how to instruct Gemini to generate content in JSON format, either by providing a schema or by letting Gemini infer the schema from the prompt.

##### JSON-Controlled Generation with Schema

This example demonstrates generating JSON output when a schema is explicitly provided.

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);
const { SchemaType } = require("@google/generative-ai");
const schema = {
    description: "List of recipes",
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            recipeName: {
                type: SchemaType.STRING,
                description: "Name of the recipe",
                nullable: false,
            },
        },
        required: ["recipeName"],
    },
};

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
    },
});

const result = await model.generateContent("List a few popular cookie recipes.");
console.log(result.response.text());
```

##### JSON-Controlled Generation with Inferred Schema

This example demonstrates generating JSON output by providing instructions in the prompt on what the JSON structure should be.

```javascript
const genAI = new GeminiApp(YOUR_CONFIG);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

const prompt = `List a few popular cookie recipes using this JSON schema:

  Recipe = {'recipeName': string}
  Return: Array<Recipe>`;

const result = await model.generateContent(prompt);
console.log(result.response.text());
```

#### Process a PDF with Caching

This example demonstrates how to use the caching system to avoid processing PDF files multiple times, saving API tokens for multiple prompts against the same PDF content. This example requires you to include the [GoogleAICacheManager.js](/src/GoogleAICacheManager.js) in your Google Apps Script project.

```javascript
  const genAI = new GeminiApp(YOUR_CONFIG);
  const inlineParts = fileToGenerativePart("YOUR_FILE_ID");
  // Create a cache that uses the uploaded file.
  const cacheManager = new GoogleAICacheManager(YOUR_CONFIG);
  const cacheResult = await cacheManager.create({
    "model": "models/gemini-1.5-flash-002",
    "contents": [
      {
        "parts": [inlineParts],
        "role": "user"
      }
    ],
    "systemInstruction": {
      "parts": [
        {
          "text": "You are an expert at analyzing transcripts."
        }
      ]
    },
    "ttl": "300s"
  });


  const model = genAI.getGenerativeModelFromCachedContent(cacheResult);

  const prompt = "Please give a short summary of this file.";

  // Call `countTokens` to get the input token count
  // of the combined text and file (`totalTokens`).
  const result = await model.countTokens(prompt);

  const generateResult = await model.generateContent(prompt);

  // On the response for `generateContent`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the cached content token count and the combined total
  // token count.
  console.log(generateResult.response.usageMetadata);

  const cacheList = cacheManager.list();
  console.log(cacheManager.get(cacheResult.name))

  await cacheManager.delete(cacheResult.name);
```

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

const model = genAI.getGenerativeModel({ model: "MODEL_NAME", safetySettings: safetySettings });
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

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
To use function calling your declared functions also need to exist in your Apps Script project, as these functions are executed by GeminiApp and the responses are returned to the model. For a complete example visit [Exploring Gemini API Function Calling with Google Apps Script](https://medium.com/cts-technologies/genai-for-google-workspace-exploring-gemini-api-function-calling-with-google-apps-script-part-3-028785dafe3b)

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
