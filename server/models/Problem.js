const mongoose =
   global.commonMongoose || require("mongoose");

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

      starterCode: {
         cpp: String,
         java: String,
         python: String
      },

      sampleTestCases: [
         {
            input: String,
            output: String,
            explanation: String
         }
      ],

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

         theme: String,

         family: String
      },

      editorial: {
         type: {
            intuition: String,
            bruteForce: String,
            optimized: String,
            timeComplexity: String,
            spaceComplexity: String,
            edgeCases: [String]
         },
         select: false
      },

      referenceSolution: {
         type: {
            code: String,
            language: String,
            complexity: String
         },
         select: false
      },

      hiddenTests: {
         type: [
            {
               input: Object,
               output: String
            }
         ],
         select: false,
         default: []
      },

      hiddenTestCases: {
         type: [
            {
               input: String,
               output: String
            }
         ],
         select: false,
         default: []
      },

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
