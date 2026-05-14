function generateMaxTest() {

   const n = 1000;

   const arr = [];

   for(let i = 0; i < n; i++) {

      arr.push(
         Math.floor(Math.random() * 100)
      );
   }

   return {
      n,
      arr,
      minDistance: 2
   };
}

module.exports =
   generateMaxTest;