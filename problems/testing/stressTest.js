const bruteForceSolve =
   require("../solutions/bruteForce");

const optimizedSolve =
   require("../solutions/optimized");

const generateRandomTest =
   require("../testcases/generators/randomGenerator");

function stressTest() {

   const TESTS = 1000;

   for(let t = 1; t <= TESTS; t++) {

      const test =
         generateRandomTest();

      const bruteAnswer =
         bruteForceSolve(
            test.arr,
            test.minDistance
         );

      const optimizedAnswer =
         optimizedSolve(
            test.arr,
            test.minDistance
         );

      if(
         bruteAnswer !== optimizedAnswer
      ) {

         console.log(
            "Mismatch Found!"
         );

         console.log(test);

         console.log({
            bruteAnswer,
            optimizedAnswer
         });

         return;
      }

      console.log(
         `Test ${t} passed`
      );
   }

   console.log(
      "All stress tests passed!"
   );
}

stressTest();