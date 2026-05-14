const bruteForceSolve =
   require("../../solutions/bruteForce");

function generateOutputs(
   tests
) {

   return tests.map(test => {

      const output =
         bruteForceSolve(
            test.arr,
            test.minDistance
         );

      return {

         input: test,

         output
      };
   });
}

module.exports =
   generateOutputs;