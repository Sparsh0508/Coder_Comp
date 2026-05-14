const {
   GoogleGenerativeAI
} = require("@google/generative-ai");

const buildCodePrompt =
   require("./buildCodePrompt");

const genAI =
   new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
   );

async function generateCode(
   problem
) {

   const model =
      genAI.getGenerativeModel({
         model: "gemini-2.5-flash"
      });

   const prompt =
      buildCodePrompt(problem);

   const result =
      await model.generateContent(
         prompt
      );

   const response =
      result.response.text();

   const clean =
      response
         .replace(/```json/g, "")
         .replace(/```/g, "")
         .trim();

   return JSON.parse(clean);
}

module.exports =
   generateCode;