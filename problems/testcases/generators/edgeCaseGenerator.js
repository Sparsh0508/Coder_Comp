function generateEdgeCases(options = {}) {

   const minDistance =
      options.minDistance || 2;

   const minN =
      Math.max(2, minDistance);

   return [

      // minimum input
      {
         n: minN,
         arr: Array(minN).fill(1),
         minDistance
      },

      // all same
      {
         n: 8,
         arr: [5,5,5,5,5,5,5,5],
         minDistance
      },

      // all unique
      {
         n: 8,
         arr: [1,2,3,4,5,6,7,8],
         minDistance
      },

      // alternating
      {
         n: 10,
         arr: [1,2,1,2,1,2,1,2,1,2],
         minDistance
      },

      // max values
      {
         n: 6,
         arr: [
            1e9,
            1e9,
            1e9,
            1e9,
            1e9,
            1e9
         ],
         minDistance
      }
   ];
}

module.exports =
   generateEdgeCases;
