function generateRandomTest(options = {}) {

   const minDistance =
      options.minDistance || 2;

   const minN =
      Math.max(2, minDistance);

   const n =
      options.n ||
      Math.floor(Math.random() * 10) + minN;

   const valueRange =
      options.valueRange || 5;

   const arr = [];

   for(let i = 0; i < n; i++) {

      arr.push(
         Math.floor(Math.random() * valueRange)
      );
   }

   return {
      n,
      arr,
      minDistance
   };
}

module.exports =
   generateRandomTest;
