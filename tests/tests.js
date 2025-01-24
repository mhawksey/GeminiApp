/**
 * @license
 * Copyright 2024 Google LLC
 * Copyright 2025 Martin Hawksey
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
 * Overview of Test Functions:
 *
 * This file contains a suite of test functions demonstrating various capabilities
 * of the Generative AI SDK, including text generation, chat interactions,
 * code execution, token counting, JSON-controlled generation,
 * multimodal interactions with images and PDFs, handling cached content, and function calling.
 * Each function is designed to showcase specific features and use cases of the SDK.
 *
 * Functions Summary:
 *  - textGenTextOnlyPrompt(): Demonstrates basic text generation from a given prompt.
 *  - chat(): Illustrates a multi-turn chat conversation using the SDK.
 *  - codeExecutionBasic(): Shows how to generate and execute code based on a prompt, using gemini-2.0-flash-exp.
 *  - codeExecutionRequestOverride(): Similar to codeExecutionBasic, but with request override.
 *  - codeExecutionChat(): Demonstrates code execution within a chat context.
 *  - tokensTextOnly(): Counts tokens in a text prompt and a generated response.
 *  - tokensChat(): Counts tokens in a chat history and a new message.
 *  - jsonControlledGeneration(): Generates content in JSON format based on a provided schema.
 *  - jsonNoSchema(): Generates content in JSON format based on schema inferred from prompt instructions.
 *  - runTextAndImages(): Processes a prompt with text and images to generate a response.
 *  - runPDF(): Processes a prompt with a PDF file to generate a response.
 *  - runPDFWithCache(): Demonstrates handling PDF content with caching for efficient token usage.
 *  - basicFunctionCalling(): Shows new function calling in gemini-pro for executing external functions based on model responses.
 *  - functionCalling(): Demonstrates function calling with gemini-1.5-flash and a custom function declaration.
 *  - systemInstruction(): Uses system instructions to guide the model's behavior and persona.
 *  - tokensSystemInstruction(): Counts tokens with and without system instructions to show their impact on token usage.
 */

// Using Google AI Studio Key
const process = {
     env:
       { API_KEY: 'YOUR_API_KEY' }
};

// Using Google Vertex AI 
// Uncomment and remove `process` declration above
// const process = {
//   env:
//   {
//     API_KEY: {
//       region: 'us-central1',
//       project_id: 'YOUR_GCP_PROJECT_ID'
//     }
//   }
// };

// @See https://github.com/google-gemini/generative-ai-js/tree/main/samples

async function textGenTextOnlyPrompt() {
  // [START text_gen_text_only_prompt]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Write a story about a magic backpack.";

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  // [END text_gen_text_only_prompt]
}

async function chat() {
  // [START chat]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  });
  let result = await chat.sendMessage("I have 2 dogs in my house.");
  console.log(result.response.text());
  result = await chat.sendMessage("How many paws are in my house?");
  console.log(result.response.text());
  // [END chat]
}

async function codeExecutionBasic() {
  // [START code_execution_basic]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel(
    {
      model: "gemini-2.0-flash-exp",
      tools: [{ codeExecution: {} }],
    },
    // { apiVersion: "v1beta1" } // uncomment this line if you are using vertex-ai/generative-ai/docs/multimodal/code-execution
  );

  const result = await model.generateContent(
    "What is the sum of the first 50 prime numbers? " +
    "Generate and run code for the calculation, and make sure you get " +
    "all 50.",
  );

  console.log(result.response.text());
  // [END code_execution_basic]
}

async function codeExecutionRequestOverride() {
  // [START code_execution_request_override]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel(
    {
      model: "gemini-2.0-flash-exp",
    },
    // { apiVersion: "v1beta1" } // uncomment this line if you are using vertex-ai/generative-ai/docs/multimodal/code-execution
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
  // [END code_execution_request_override]
}

async function codeExecutionChat() {
  // [START code_execution_chat]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel(
    {
      model: "gemini-2.0-flash-exp",
      tools: [{ codeExecution: {} }],
    },
    // { apiVersion: "v1beta1" } // uncomment this line if you are using vertex-ai/generative-ai/docs/multimodal/code-execution
  );

  const chat = model.startChat();

  const result = await chat.sendMessage(
    "What is the sum of the first 50 prime numbers? " +
    "Generate and run code for the calculation, and make sure you get " +
    "all 50.",
  );

  console.log(result.response.text());
  // [END code_execution_chat]
}

async function tokensTextOnly() {
  // [START tokens_text_only]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  // Count tokens in a prompt without calling text generation.
  const countResult = await model.countTokens(
    "The quick brown fox jumps over the lazy dog.",
  );

  console.log(countResult.totalTokens); // 11

  const generateResult = await model.generateContent(
    "The quick brown fox jumps over the lazy dog.",
  );

  // On the response for `generateContent`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the combined token count (`totalTokenCount`).
  console.log(generateResult.response.usageMetadata);
  // candidatesTokenCount and totalTokenCount depend on response, may vary
  // { promptTokenCount: 11, candidatesTokenCount: 124, totalTokenCount: 135 }
  // [END tokens_text_only]
}

async function tokensChat() {
  // [START tokens_chat]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hi my name is Bob" }],
      },
      {
        role: "model",
        parts: [{ text: "Hi Bob!" }],
      },
    ],
  });

  const countResult = await model.countTokens({
    generateContentRequest: { contents: await chat.getHistory() },
  });
  console.log(countResult.totalTokens); // 10

  const chatResult = await chat.sendMessage(
    "In one sentence, explain how a computer works to a young child.",
  );

  // On the response for `sendMessage`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the combined token count (`totalTokenCount`).
  console.log(chatResult.response.usageMetadata);
  // candidatesTokenCount and totalTokenCount depend on response, may vary
  // { promptTokenCount: 25, candidatesTokenCount: 25, totalTokenCount: 50 }
  // [END tokens_chat]
}

async function jsonControlledGeneration() {
  // [START json_controlled_generation]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);

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
      responseSchema: schema
    }
  });

  const result = await model.generateContent(
    "List a few popular cookie recipes.",
  );
  console.log(result.response.text());
  // [END json_controlled_generation]
}

async function jsonNoSchema() {
  // [START json_no_schema]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `List a few popular cookie recipes using this JSON schema:

  Recipe = {'recipeName': string}
  Return: Array<Recipe>`;

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  // [END json_no_schema]
}

function fileToGenerativePart_(id) {
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
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  // For text-and-images input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });

  const prompt = "What's different between these pictures?";

  const imageParts = [
    fileToGenerativePart_("1LXeJgNhlpnpS0RBfil6Ybx7QRvfqwvEh"),
    fileToGenerativePart_("1OFV88Zf5esi-Mtuap4iQyoCVeYlvIeqU"),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);

}

async function runPDF() {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });

  const prompt = "What does the pdf file says?";

  const imageParts = [
    fileToGenerativePart_("1oamLVEo47-SFqsg6ZV-Pl3xQg0iuho7nMOfOqVl8RdDFyH_gWe8"),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}

async function runPDFWithCache() {

  const inlineParts = fileToGenerativePart_("1CCgkI5k_BUPvhl21t2cX_QtC1ZZqYYpF");
  // Create a cache that uses the uploaded file.
  // Requires 
  const cacheManager = new GoogleAICacheManager(process.env.API_KEY);
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

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
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
  // {
  //   promptTokenCount: 323396,
  //   candidatesTokenCount: 113, (depends on response, may vary)
  //   totalTokenCount: 323509,
  //   cachedContentTokenCount: 323386
  // }
  const cacheList = cacheManager.list();
  console.log(cacheManager.get(cacheResult.name))

  await cacheManager.delete(cacheResult.name);
  // [END tokens_cached_content]
}

/**
 * Multiplies an input value by 2.
*/
function double_(input) {
  console.log(`Gemini has asked to call this function and double ${input}`)
  return { result: input * 2 };
}

async function basicFunctionCalling() {

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

async function functionCalling() {
  // [START function_calling]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  async function setLightValues(brightness, colorTemperature) {
    // This mock API returns the requested lighting values
    return {
      brightness,
      colorTemperature,
    };
  }

  const controlLightFunctionDeclaration = {
    name: "controlLight",
    parameters: {
      type: "OBJECT",
      description: "Set the brightness and color temperature of a room light.",
      properties: {
        brightness: {
          type: "NUMBER",
          description:
            "Light level from 0 to 100. Zero is off and 100 is full brightness.",
        },
        colorTemperature: {
          type: "STRING",
          description:
            "Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.",
        },
      },
      required: ["brightness", "colorTemperature"],
    },
  };

  // Executable function code. Put it in a map keyed by the function name
  // so that you can call it once you get the name string from the model.
  const functions = {
    controlLight: ({ brightness, colorTemperature }) => {
      console.log(`setLightValues called ${brightness} ${colorTemperature}`)
      return setLightValues(brightness, colorTemperature);
    },
  };

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: { functionDeclarations: [controlLightFunctionDeclaration] },
  });
  const chat = model.startChat();
  const prompt = "Dim the lights so the room feels cozy and warm.";

  // Send the message to the model.
  const result = await chat.sendMessage(prompt);

  // For simplicity, this uses the first function call found.
  const call = result.response.functionCalls()[0];

  if (call) {
    // Call the executable function named in the function call
    // with the arguments specified in the function call and
    // let it call the hypothetical API.
    const apiResponse = await functions[call.name](call.args);

    // Send the API response back to the model so it can generate
    // a text response that can be displayed to the user.
    const result2 = await chat.sendMessage([
      {
        functionResponse: {
          name: "controlLight",
          response: apiResponse,
        },
      },
    ]);

    // Log the text response.
    console.log(result2.response.text());
  }
  // [END function_calling]
}

async function systemInstruction() {
  // [START system_instruction]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are a cat. Your name is Neko.",
  });

  const prompt = "Good morning! How are you?";

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  console.log(text);
  // [END system_instruction]
}

async function tokensSystemInstruction() {
  // [START tokens_system_instruction]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const prompt = "The quick brown fox jumps over the lazy dog.";
  const modelNoInstructions = genAI.getGenerativeModel({
    model: "models/gemini-1.5-flash",
  });

  const resultNoInstructions = await modelNoInstructions.countTokens(prompt);

  console.log(resultNoInstructions);
  // { totalTokens: 11 }

  const modelWithInstructions = genAI.getGenerativeModel({
    model: "models/gemini-1.5-flash",
    systemInstruction: "You are a cat. Your name is Neko.",
  });

  const resultWithInstructions =
    await modelWithInstructions.countTokens(prompt);

  // The total token count includes everything sent to the
  // generateContent() request. When you use system instructions, the
  // total token count increases.
  console.log(resultWithInstructions);
  // { totalTokens: 23 }
  // [END tokens_system_instruction]
}