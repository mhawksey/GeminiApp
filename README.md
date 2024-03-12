# GeminiApp Google Apps Script Library Documentation

The GeminiApp is a library that allows integration to Google's Gemini API in your Google Apps Script projects. It allows for structured conversation and function calling.

> **Acknowledgement** - this library is based on [ChatGPTApp](https://github.com/scriptit-fr/ChatGPTApp) by Guillemine Allavena and Romain Vialard at [Scriptit](https://www.scriptit.fr/).


## Table of Contents

###### How to use : 

* [Setup](#setup)
* [Create a New Chat](#create-a-new-chat)
* [Add Messages](#add-messages)
* [Add Callable Functions](#add-callable-function)
* [Run the Chat](#run-the-chat)

###### Examples :

 * [Send a prompt and get completion](#example-1--send-a-prompt-and-get-completion)
 * [Ask Gemini to create a draft reply for the last email in Gmail inbox](#example-2--ask-gemini-to-create-a-draft-reply-for-the-last-email-in-gmail-inbox)
 * [Retrieve structured data instead of raw text with onlyReturnArgument()](#example-3--retrieve-structured-data-instead-of-raw-text-with-onlyreturnargument)

###### Reference :

 * [Function Class](#function-object)
 * [Chat Class](#chat)
 * [Notes](#note)



## How to use

> **Important:** This library is designed for the Vertex AI Gemini 1.0 Pro API. Latest product information in included on the [Vertex AI Gemini API documentation page](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini).


### Setup

#### Option 1 - Cloud Platform project

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
6. In your main script file you can initialize the GeminiApp library by calling the `GeminiApp.init(location, project)` method providing a [supported region](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini#http_request) and Cloud project ID:

```javascript
GeminiApp.init("us-central1", "my-project-id");
```
#### Option 2 - Google AI Studio API Key
> **Important** Google AI Studio is currently available in 180+ countries, check out the [documentation to learn more](https://ai.google.dev/available_regions). Google AI Studio must only be used for prototyping with generative models 

1. [Get an API Key](https://ai.google.dev/tutorials/setup).

1. Add the [GeminiApp library](src/GeminiApp.js) to your project as a new script file.

1. In your main script file you can initialize the GeminiApp library by calling the `GeminiApp.initWithKey(key)`


### Create a New Chat

To start a new chat, call the `newChat()` method. This creates a new Chat instance.

```javascript
let chat = GeminiApp.newChat();
```

### Add Contents

You can add messages to your chat using the `addContent()` method. Messages can be from the user or the system.

```javascript
chat.addContent("Hello, how are you?");
chat.addContent("Answer to the user in a professional way.", true);
```

### Add a Google Drive image/video

You can add a multimodal message with an image or video from Google Drive using the `addDriveData()` method.

```javascript
const file = DriveApp.getFileById('YOUR_IMAGE_VIDEO_FILE_ID');
chat.addDriveData("Describe this image: ", file);
```

### Add callable Function

The `newFunction()` method allows you to create a new Function instance. You can then add this function to your chat using the `addFunction()` method.

```javascript
let functionObject = GeminiApp.newFunction()
  .setName("myFunction")
  .setDescription("This is a test function.")
  .addParameter("arg1", "STRING", "This is the first argument.");

chat.addFunction(functionObject);
```

From the moment that you add a function to chat, we will use Gemini API's function calling features.

For more information : [https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/function-calling](https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/function-calling)

### Run the Chat

Once you have set up your chat, you can start the conversation by calling the `run()` method.

```javascript
let response = chat.run();
```

## Examples

### Example 1 : Send a prompt and get completion

```javascript
function example1() {
  GeminiApp.init("us-central1", "my-project-id");

  const chat = GeminiApp.newChat();
  chat.addContent("What are the steps to add an external library to my Google Apps Script project?");

  const chatAnswer = chat.run();
  Logger.log(chatAnswer);
}
```

### Example 2 : Ask Gemini to create a draft reply for the last email in Gmail inbox

```javascript
function example2() {
  GeminiApp.init("us-central1", "my-project-id");

  var getLatestThreadFunction = GeminiApp.newFunction()
    .setName("getLatestThread")
    .setDescription("Retrieve information from the last email message received.");

  var createDraftResponseFunction = GeminiApp.newFunction()
    .setName("createDraftResponse")
    .setDescription("Create a draft response.")
    .addParameter("threadId", "STRING", "the ID of the thread to retrieve")
    .addParameter("body", "STRING", "the body of the email in plain text");

  var resp = GeminiApp.newChat()
    .addContent("Retrieve the latest message thread I received. Create a draft response to the message to reply to the threadId")
    .addFunction(getLatestThreadFunction)
    .addFunction(createDraftResponseFunction)
    .run();

  Logger.log(resp);
}
```

### Example 3 : Retrieve structured data instead of raw text with onlyReturnArgument()

```javascript
function example3() {
  GeminiApp.init(GeminiApp.init("us-central1", "my-project-id"));

  const ticket = "Hello, could you check the status of my subscription under customer@example.com";

  const chat = GeminiApp.newChat();
  chat.addContent(`You just received this ticket :  ${ticket}
                   What's the customer email address ? You will give it to me using the function getEmailAddress.`);

  const myFunction = GeminiApp.newFunction() // in this example, getEmailAddress is not actually a real function in your script
    .setName("getEmailAddress")
    .setDescription("To give the user an email address")
    .addParameter("emailAddress", "STRING", "the email address")
    .onlyReturnArguments(true) // you will get your parameters in a json object

  chat.addFunction(myFunction);

  const chatAnswer = chat.run();
  Logger.log(chatAnswer["emailAddress"]); // the name of the parameter of your "fake" function

  // output : 	"customer@example.com"
}
```


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

#### `run([advancedParametersObject])`

Start the chat conversation. It sends all your messages and any added function to the chat GPT. It will return the last chat answer.

Supported attributes for the advanced parameters :

```javascript
advancedParametersObject = {
	temperature: number,
    max_output_tokens: integer,
    safetySettings: object
}
```

**Temperature** : Lower values for temperature result in more consistent outputs, while higher values generate more diverse and creative results. Select a temperature value based on the desired trade-off between coherence and creativity for your specific application.

### Note

If you wish to disable the library logs and keep only your own, call `disableLogs()`:

```javascript
GeminiApp.disableLogs();
```

This can be useful for keeping your logs clean and specific to your application.