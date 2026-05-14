const validateStructure =
   require("./structureValidator");

const validateConstraints =
   require("./constraintValidator");

const validateSamples =
   require("./sampleValidator");

const validateMutation =
   require("./mutationValidator");

const validateComplexity =
   require("./complexityValidator");

function validateProblem(
   structure,
   problem
) {

   const baseValidators = [

      validateStructure,
      validateConstraints,
      validateSamples
   ];

   for(const validator of baseValidators) {

      const result =
         validator(problem);

      if(!result.valid) {

         return result;
      }
   }

   const mutationResult =
      validateMutation(
         structure,
         problem
      );

   if(!mutationResult.valid) {

      return mutationResult;
   }

   const complexityResult =
      validateComplexity(
         structure,
         problem
      );

   if(!complexityResult.valid) {

      return complexityResult;
   }

   return {
      valid: true
   };
}

module.exports =
   validateProblem;