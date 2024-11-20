const genAI = new GeminiApp(YOUR_API_KEY);

async function runTextOnly() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = "Write a story about a magic backpack."

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}

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

async function systemInstruction() {
  // [START system_instruction]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  //const genAI = new GoogleGenerativeAI(process.env.API_KEY);
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

async function jsonControlledGeneration() {
  // [START json_controlled_generation]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
  //const genAI = new GoogleGenerativeAI(process.env.API_KEY);

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

  const result = await model.generateContent(
    "List a few popular cookie recipes.",
  );
  console.log(result.response.json());
  // [END json_controlled_generation]
}