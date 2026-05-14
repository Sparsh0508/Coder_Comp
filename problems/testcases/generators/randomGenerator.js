function generateRandomTest() {

   const n =
      Math.floor(Math.random() * 10) + 2;

   const arr = [];

   for(let i = 0; i < n; i++) {

      arr.push(
         Math.floor(Math.random() * 5)
      );
   }

   return {
      n,
      arr,
      minDistance: 2
   };
}

module.exports =
   generateRandomTest;