const generateRandomTest =
   require("../generators/randomGenerator");

const generateEdgeCases =
   require("../generators/edgeCaseGenerator");

function buildHiddenTests() {

   const hiddenTests = [];

   // edge cases
   const edgeCases =
      generateEdgeCases();

   hiddenTests.push(...edgeCases);

   // random cases
   for(let i = 0; i < 20; i++) {

      hiddenTests.push(
         generateRandomTest()
      );
   }

   return hiddenTests;
}

module.exports =
   buildHiddenTests;