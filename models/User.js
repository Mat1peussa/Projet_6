const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const MongooseErrors = require('mongoose-errors')

//Les adresses électroniques dans la base de données sont uniques
const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true},
  password: { type: String, required: true },
});

/**
 * On utilise ce plugin pour gérer l'unicité
 */
userSchema.plugin(uniqueValidator);
userSchema.plugin(MongooseErrors);

module.exports = mongoose.model('User', userSchema);