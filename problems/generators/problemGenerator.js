const generateStatement =
   require("../ai/generateStatement");

const validateProblem =
   require("../validators/problemValidator");

const generateEditorial =
   require("../editorial/generateEditorial");

const Problem =
   require("../../server/models/Problem");

const themes =
   require("../utils/themes");

const {
   selectProblemFamily
} = require("../specs/problemFamilies");

function normalizeDifficulty(difficulty) {
   const map = {
      easy: "Easy",
      medium: "Medium",
      hard: "Hard"
   };

   return map[String(difficulty).toLowerCase()] || "Easy";
}

async function generateProblem(
   difficulty = "easy",
   options = {}
) {

   const MAX_RETRIES = 5;
   const errors = [];
   const requestedDifficulty =
      String(difficulty || "easy").toLowerCase();

   for(
      let attempt = 1;
      attempt <= MAX_RETRIES;
      attempt++
   ) {

      try {

         const family =
            selectProblemFamily(
               options.family || options.pattern
            );

         const theme =
            themes[
               Math.floor(
                  Math.random() *
                  themes.length
               )
            ];

         const structure =
            family.createStructure({
               difficulty:
                  requestedDifficulty,
               theme
            });

         const aiProblem =
            await generateStatement(
               structure
            );

         const canonicalProblem =
            family.normalizeProblem(
               aiProblem,
               structure
            );

         const sampleTestCases =
            family.buildSamples(
               structure
            );

         canonicalProblem.sampleInput =
            sampleTestCases[0]?.input;

         canonicalProblem.sampleOutput =
            sampleTestCases[0]?.output;

         const validation =
            validateProblem(
               structure,
               canonicalProblem
            );

         if(!validation.valid) {

            console.log(
               `Attempt ${attempt} failed:`,
               validation.error
            );

            errors.push(
               `Attempt ${attempt}: ${validation.error}`
            );

            continue;
         }

         let editorial;

         try {
            editorial =
               await generateEditorial(
                  canonicalProblem
               );
         } catch(error) {
            console.log(
               `Attempt ${attempt} editorial fallback:`,
               error.message
            );

            editorial =
               family.buildFallbackEditorial(
                  canonicalProblem,
                  structure
               );
         }

         const hiddenTests =
            family.buildHiddenTests(
               structure
            );

         const outputs =
            family.generateOutputs(
               hiddenTests,
               structure
            );

         const savedProblem =
            await Problem.create({

               ...canonicalProblem,

               difficulty:
                  normalizeDifficulty(
                     requestedDifficulty
                  ),

               starterCode:
                  family.buildStarterCode(
                     structure
                  ),

               sampleInput:
                  sampleTestCases[0]?.input,

               sampleOutput:
                  sampleTestCases[0]?.output,

               sampleTestCases,

               structure,

               editorial,

               referenceSolution:
                  family.buildReferenceSolution(
                     structure
                  ),

               hiddenTestCases:
                  outputs
            });

         console.log(
            `Generation succeeded on attempt ${attempt} (${family.id})`
         );

         return savedProblem;

      } catch(error) {

         errors.push(
            `Attempt ${attempt}: ${error.message}`
         );

         console.log(
            `Attempt ${attempt} crashed:`,
            error.message
         );
      }
   }

   throw new Error(
      `Failed to generate valid problem. ${errors.join(" | ")}`
   );
}

module.exports =
   generateProblem;
