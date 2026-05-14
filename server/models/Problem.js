const mongoose =
   require("mongoose");

const ProblemSchema =
   new mongoose.Schema({

      title: {
         type: String,
         required: true
      },

      description: {
         type: String,
         required: true
      },

      inputFormat: {
         type: String,
         required: true
      },

      outputFormat: {
         type: String,
         required: true
      },

      constraints: {
         type: [String],
         default: []
      },

      sampleInput: {
         type: String
      },

      sampleOutput: {
         type: String
      },

      explanation: {
         type: String
      },

      tags: {
         type: [String],
         default: []
      },

      difficulty: {
         type: String,
         enum: [
            "Easy",
            "Medium",
            "Hard"
         ],
         default: "Easy"
      },

      structure: {

         pattern: String,

         concepts: [String],

         mutation: {
            type: Object
         },

         constraints: {
            type: Object
         },

         theme: String
      },

      editorial: {

         intuition: String,

         bruteForce: String,

         optimized: String,

         timeComplexity: String,

         spaceComplexity: String,

         edgeCases: [String]
      },

      referenceSolution: {

         code: String,

         language: String,

         complexity: String
      },

      hiddenTests: [
         {
            input: Object,
            output: String
         }
      ],

      createdAt: {
         type: Date,
         default: Date.now
      }

   });

module.exports =
   mongoose.model(
      "Problem",
      ProblemSchema
   );