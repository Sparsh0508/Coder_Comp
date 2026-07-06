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
         // model: "gemini-2.5-flash"
         model: "gemini-3.1-flash-lite-preview"

      });

   const prompt =
      buildEditorialPrompt(problem);

   const result =
      await model.generateContent(
         prompt
      );

   const text =
      result.response.text();

   const editorial = parseJsonResponse(
      text,
      "Editorial response"
   );

   if (editorial && editorial.edgeCases) {
      if (typeof editorial.edgeCases === "string") {
         try {
            const parsed = JSON.parse(editorial.edgeCases);
            if (Array.isArray(parsed)) {
               editorial.edgeCases = parsed;
            } else {
               editorial.edgeCases = [editorial.edgeCases];
            }
         } catch (e) {
            editorial.edgeCases = [editorial.edgeCases];
         }
      }

      if (Array.isArray(editorial.edgeCases)) {
         editorial.edgeCases = editorial.edgeCases.map(item => {
            if (item && typeof item === "object") {
               const name = item.name || item.title || "";
               const desc = item.description || item.desc || "";
               return `${name}${name && desc ? ": " : ""}${desc}`.trim();
            }
            return String(item);
         });
      } else {
         editorial.edgeCases = [];
      }
   }

   return editorial;
}

module.exports =
   generateEditorial;
