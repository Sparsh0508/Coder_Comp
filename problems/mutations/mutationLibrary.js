const mutations = {

   distance_constraint: () => ({

      type: "distance_constraint",

      minDistance:
         Math.floor(Math.random() * 5) + 1
   }),

   circular_array: () => ({

      type: "circular_array"
   }),

   dynamic_queries: () => ({

      type: "dynamic_queries",

      queries:
         Math.floor(Math.random() * 1000) + 1
   })
};

module.exports = mutations;