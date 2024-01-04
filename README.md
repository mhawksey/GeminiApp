# GeminiApp Google Apps Script Library Documentation

The GeminiApp is a library that allows integration to Google's Gemini AI API in your Google Apps Script projects. It allows for structured conversation and function calling.

## Table of Contents

###### How to use : 

* [Setup](#setup)
* [Create a New Chat](#create-a-new-chat)
* [Add Messages](#add-messages)
* [Add Callable Functions](#add-callable-function)
* [Enable web browsing (optional)](#enable-web-browsing-optional)
* [Run the Chat](#run-the-chat)

###### Examples :

 * [Send a prompt and get completion](#example-1--send-a-prompt-and-get-completion)
 * [Ask Gemini to create a draft reply for the last email in Gmail inbox](#example-2--ask-gemini-to-create-a-draft-reply-for-the-last-email-in-gmail-inbox)
 * [Retrieve structured data instead of raw text with onlyReturnArgument()](#example-3--retrieve-structured-data-instead-of-raw-text-with-onlyreturnargument)
 * [Use web browsing](#example-4--use-web-browsing)
###### Reference :

 * [Function Class](#function-object)
 * [Chat Class](#chat)
 * [Notes](#note)



## How to use

> **Important:** Vertex AI Gemini API is currently in public preview and is subject to change. Latest product information in included on the [Vertex AI Gemini API documentation page](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini).


### Setup

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

### Create a New Chat

To start a new chat, call the `newChat()` method. This creates a new Chat instance.

```javascript
let chat = GeminiApp.newChat();
```

### Add Messages

You can add messages to your chat using the `addMessage()` method. Messages can be from the user or the system.

```javascript
chat.addMessage("Hello, how are you?");
chat.addMessage("Answer to the user in a professional way.", true);
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
 GeminiApp.init(VERTEX_AI_LOCATION_ID, PROJECT_ID);

 const chat = GeminiApp.newChat();
 chat.addMessage("What are the steps to add an external library to my Google Apps Script project?");

 const chatAnswer = chat.run();
 Logger.log(chatAnswer);
```

### Example 2 : Ask Gemini to create a draft reply for the last email in Gmail inbox

```javascript
 GeminiApp.init(VERTEX_AI_LOCATION_ID, PROJECT_ID);
 const chat = GeminiApp.newChat();

 var getLatestThreadFunction = GeminiApp.newFunction()
    .setName("getLatestThread")
    .setDescription("Retrieve information from the last message received.");

 var createDraftResponseFunction = GeminiApp.newFunction()
    .setName("createDraftResponse")
    .setDescription("Create a draft response.")
    .addParameter("threadId", "STRING", "the ID of the thread to retrieve")
    .addParameter("body", "STRING", "the body of the email in plain text");

  var resp = GeminiApp.newChat()
    .addMessage("You are an assistant managing my Gmail inbox.", true)
    .addMessage("Retrieve the latest message I received and draft a response.")
    .addFunction(getLatestThreadFunction)
    .addFunction(createDraftResponseFunction)
    .run();

  console.log(resp);
```

### Example 3 : Retrieve structured data instead of raw text with onlyReturnArgument()

```javascript
  const ticket = "Hello, could you check the status of my subscription under customer@example.com";

  chat.addMessage("You just received this ticket : " + ticket);
  chat.addMessage("What's the customer email address ? You will give it to me using the function getEmailAddress.");

  const myFunction = GeminiApp.newFunction() // in this example, getEmailAddress is not actually a real function in your script
    .setName("getEmailAddress")
    .setDescription("To give the user an email address")
    .addParameter("emailAddress", "STRING", "the email address")
    .onlyReturnArguments(true) // you will get your parameters in a json object

  chat.addFunction(myFunction);

  const chatAnswer = chat.run();
  Logger.log(chatAnswer["emailAddress"]); // the name of the parameter of your "fake" function

  // output : 	"customer@example.com"
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
    max_output_tokens: integer
}
```

**Temperature** : Lower values for temperature result in more consistent outputs, while higher values generate more diverse and creative results. Select a temperature value based on the desired trade-off between coherence and creativity for your specific application.

### Note

If you wish to disable the library logs and keep only your own, call `disableLogs()`:

```javascript
GeminiApp.disableLogs();
```

This can be useful for keeping your logs clean and specific to your application.