function optimizedSolve(
   arr,
   minDistance
) {

   let count = 0;
   const eligibleCounts =
      new Map();

   for(let j = 0; j < arr.length; j++) {

      const eligibleIndex =
         j - minDistance;

      if(eligibleIndex >= 0) {

         const eligibleValue =
            arr[eligibleIndex];

         eligibleCounts.set(
            eligibleValue,
            (eligibleCounts.get(eligibleValue) || 0) + 1
         );
      }

      count +=
         eligibleCounts.get(arr[j]) || 0;
   }

   return count;
}

module.exports =
   optimizedSolve;
