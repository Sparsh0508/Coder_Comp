const pairMatching =
   require("../patterns/pairMatching");

const mutationEngine =
   require("../mutations/mutationEngine");

const constraintEngine =
   require("../constraints/constraintEngine");

const generateStatement =
   require("../ai/generateStatement");

const validateProblem =
   require("../validators/problemValidator");

const generateEditorial =
   require("../editorial/generateEditorial");

const generateCode =
   require("../codegen/generateCode");

const buildHiddenTests =
   require("../testcases/hidden/buildHiddenTests");

const generateOutputs =
   require("../testcases/hidden/generateOutputs");

const Problem =
   require("../../server/models/Problem");

const themes =
   require("../utils/themes");

async function generateProblem(
   difficulty = "easy"
) {

   const MAX_RETRIES = 5;

   for(
      let attempt = 1;
      attempt <= MAX_RETRIES;
      attempt++
   ) {

      try {

         const mutation =
            mutationEngine.applyMutation(
               pairMatching
            );

         const constraints =
            constraintEngine.generateConstraints(
               difficulty
            );

         const theme =
            themes[
               Math.floor(
                  Math.random() *
                  themes.length
               )
            ];

         const structure = {

            pattern:
               pairMatching.name,

            concepts:
               pairMatching.concepts,

            mutation,

            constraints,

            theme
         };

       
         const aiProblem =
            await generateStatement(
               structure
            );

        
         const validation =
            validateProblem(
               structure,
               aiProblem
            );

         if(!validation.valid) {

            console.log(
               `Attempt ${attempt} failed:`,
               validation.error
            );

            continue;
         }

       
         const editorial =
            await generateEditorial(
               aiProblem
            );

       
         const referenceSolution =
            await generateCode(
               aiProblem
            );

         
         const hiddenTests =
            buildHiddenTests();

         
         const outputs =
            generateOutputs(
               hiddenTests
            );

         
         const savedProblem =
            await Problem.create({

               ...aiProblem,

               structure,

               editorial,

               referenceSolution,

               hiddenTests: outputs
            });

         console.log(
            `Generation succeeded on attempt ${attempt}`
         );

         return savedProblem;

      } catch(error) {

         console.log(
            `Attempt ${attempt} crashed:`,
            error.message
         );
      }
   }

   throw new Error(
      "Failed to generate valid problem"
   );
}

module.exports =
   generateProblem;