function generateRandomTest() {

   const n =
      Math.floor(Math.random() * 8) + 2;

   const arr = [];

   for(let i = 0; i < n; i++) {

      arr.push(
         Math.floor(Math.random() * 5)
      );
   }

   return {
      arr,
      minDistance: 2
   };
}

module.exports =
   generateRandomTest;