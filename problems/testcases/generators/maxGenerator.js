function generateMaxTest(options = {}) {

   const n =
      Math.min(options.n || 1000, 100000);

   const arr = [];

   for(let i = 0; i < n; i++) {

      arr.push(
         Math.floor(Math.random() * 100)
      );
   }

   return {
      n,
      arr,
      minDistance: options.minDistance || 2
   };
}

module.exports =
   generateMaxTest;
