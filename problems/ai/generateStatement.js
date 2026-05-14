const model =
   require("./geminiClient");

const buildPrompt =
   require("./promptBuilder");

async function generateStatement(problemData) {

   const prompt =
      buildPrompt(problemData);

   const result =
      await model.generateContent(prompt);

   const response =
      await result.response;

   const text =
      response.text();

   const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

   return JSON.parse(cleanedText);
}

module.exports =
   generateStatement;