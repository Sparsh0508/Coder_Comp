function bruteForceSolve(
   arr,
   minDistance
) {

   let count = 0;

   for(let i = 0; i < arr.length; i++) {

      for(let j = i + 1; j < arr.length; j++) {

         if(
            arr[i] === arr[j] &&
            Math.abs(i - j) >= minDistance
         ) {

            count++;
         }
      }
   }

   return count;
}

module.exports =
   bruteForceSolve;