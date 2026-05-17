const {
   GoogleGenerativeAI
} = require("@google/generative-ai");

const buildEditorialPrompt =
   require("./buildEditorialPrompt");

const {
   parseJsonResponse
} = require("../utils/parseJsonResponse");

const genAI =
   new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
   );

async function generateEditorial(
   problem
) {

   const model =
      genAI.getGenerativeModel({
         model: "gemini-2.5-flash"
      });

   const prompt =
      buildEditorialPrompt(problem);

   const result =
      await model.generateContent(
         prompt
      );

   const text =
      result.response.text();

   return parseJsonResponse(
      text,
      "Editorial response"
   );
}

module.exports =
   generateEditorial;
