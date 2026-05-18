const generateRandomTest =
   require("../generators/randomGenerator");

const generateEdgeCases =
   require("../generators/edgeCaseGenerator");

const generateMaxTest =
   require("../generators/maxGenerator");

function buildHiddenTests(structure = {}) {

   const hiddenTests = [];

   const minDistance =
      structure.mutation?.minDistance || 2;

   const maxN =
      structure.constraints?.n || 1000;

   // edge cases
   const edgeCases =
      generateEdgeCases({
         minDistance
      });

   hiddenTests.push(...edgeCases);

   hiddenTests.push(
      generateMaxTest({
         n: maxN,
         minDistance
      })
   );

   // random cases
   for(let i = 0; i < 20; i++) {

      hiddenTests.push(
         generateRandomTest({
            minDistance,
            valueRange: i % 3 === 0 ? 2 : 25
         })
      );
   }

   return hiddenTests;
}

module.exports =
   buildHiddenTests;
