const optimizedSolve =
   require("../../solutions/optimized");

const {
   toInputText
} = require("../../specs/pairMatchingDistanceSpec");

function generateOutputs(
   tests
) {

   return tests.map(test => {

      const output =
         optimizedSolve(
            test.arr,
            test.minDistance
         );

      return {

         input:
            toInputText(test),

         output:
            String(output)
      };
   });
}

module.exports =
   generateOutputs;
