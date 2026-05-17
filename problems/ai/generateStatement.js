const model =
   require("./geminiClient");

const buildPrompt =
   require("./promptBuilder");

const {
   parseJsonResponse
} = require("../utils/parseJsonResponse");

async function generateStatement(problemData) {

   const prompt =
      buildPrompt(problemData);

   const result =
      await model.generateContent(prompt);

   const response =
      await result.response;

   const text =
      response.text();

   return parseJsonResponse(
      text,
      "Problem statement response"
   );
}

module.exports =
   generateStatement;
