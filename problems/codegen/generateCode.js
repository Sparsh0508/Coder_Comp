const {
   GoogleGenerativeAI
} = require("@google/generative-ai");

const buildCodePrompt =
   require("./buildCodePrompt");

const {
   parseJsonResponse,
   stripCodeFence
} = require("../utils/parseJsonResponse");

const genAI =
   new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
   );

async function generateCode(
   problem
) {

   const model =
      genAI.getGenerativeModel({
         model: "gemini-3.1-flash-lite-preview"
      });

   const prompt =
      buildCodePrompt(problem);

   const result =
      await model.generateContent(
         prompt
      );

   const text =
      result.response.text();

   try {
      return parseJsonResponse(
         text,
         "Reference solution response"
      );
   } catch(error) {
      const code = stripCodeFence(text)
         .replace(/^cpp\s*/i, "")
         .trim();

      if(code.includes("#include") || code.includes("int main")) {
         return {
            code,
            language: "cpp",
            complexity: "See editorial"
         };
      }

      throw error;
   }
}

module.exports =
   generateCode;
