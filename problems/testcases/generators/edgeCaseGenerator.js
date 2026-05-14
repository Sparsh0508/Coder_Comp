function generateEdgeCases() {

   return [

      // minimum input
      {
         n: 2,
         arr: [1, 1],
         minDistance: 2
      },

      // all same
      {
         n: 8,
         arr: [5,5,5,5,5,5,5,5],
         minDistance: 2
      },

      // all unique
      {
         n: 8,
         arr: [1,2,3,4,5,6,7,8],
         minDistance: 2
      },

      // alternating
      {
         n: 10,
         arr: [1,2,1,2,1,2,1,2,1,2],
         minDistance: 2
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
         minDistance: 2
      }
   ];
}

module.exports =
   generateEdgeCases;