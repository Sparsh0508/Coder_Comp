function stripCodeFence(text) {
   return text
      .replace(/^\s*```[a-z0-9_-]*\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
}

function extractJsonObject(text) {
   const cleaned = stripCodeFence(text);

   if(cleaned.startsWith("{") && cleaned.endsWith("}")) {
      return cleaned;
   }

   const start = cleaned.indexOf("{");
   const end = cleaned.lastIndexOf("}");

   if(start !== -1 && end > start) {
      return cleaned.slice(start, end + 1);
   }

   return cleaned;
}

function parseJsonResponse(text, label = "AI response") {
   const jsonText = extractJsonObject(text);

   try {
      return JSON.parse(jsonText);
   } catch(error) {
      const preview = stripCodeFence(text).slice(0, 120);
      throw new Error(
         `${label} was not valid JSON: ${error.message}. Preview: ${preview}`
      );
   }
}

module.exports = {
   parseJsonResponse,
   stripCodeFence
};
