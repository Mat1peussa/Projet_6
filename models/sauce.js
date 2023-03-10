const mongoose = require('mongoose');
const MongooseErrors = require('mongoose-errors')

const sauceSchema = mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  manufacturer: { type: String, required: true},
  description: { type: String, required: true },
  mainPepper: { type: String, required: true},
  imageUrl: { type: String, required: true },
  heat : { type: Number, required: true},
  likes : { type: Number , default: 0},
  dislikes : { type: Number, default: 0 },
  usersLiked : {type:[String]},
  usersDisliked : {type:[String]},
});


/**
 * On utilise ce plugin pour indiquer les erreurs sur les catch
 * @param {Number}
 */
sauceSchema.plugin(MongooseErrors);
module.exports = mongoose.model('sauce', sauceSchema);
