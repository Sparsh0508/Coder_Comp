const Joi = require("joi")

const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30),
})

module.exports = {
  updateProfileSchema
}