const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${
          req.protocol}://${req.get('host')}/images/${req.file.filename
        }`
    });
  
    sauce.save()
    .then(() => { res.status(201).json({message: 'Sauce enregistré !'})})
    .catch(error => { res.status(error.statusCode).json( { error })})
};

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
  .then((sauces) => {
      res.status(200).json(sauces);
  })
  .catch((error) => {
      res.status(error.statusCode).json({
        error: error
      });
  });
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
        res.status(200).json(sauce);
    }
    ).catch((error) => {
        res.status(error.statusCode).json({
          error: error
        });
    });
};

exports.modifySauce = (req, res, next) => {
  // TODO : faire en sorte qu'une image soit retiré du dossier image quand je modifie l'image d'une sauce
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    delete sauceObject._userId;
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({ message : 'unauthorized request'});
            } else {
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                Sauce.updateOne({ 
                  _id: req.params.id}, { ...sauceObject, _id: req.params.id
                })
                .then(() => res.status(200).json({message : 'Sauce modifiée!'}))
                .catch(error => res.status(error.statusCode).json({ error }));
              })
            }
        })
        .catch((error) => {
            res.status(error.statusCode).json({ error });
        });
};

exports.deleteSauce = (req, res) => {
  Sauce.findOne({ _id: req.params.id})
     .then(sauce => {
        if (sauce.userId != req.auth.userId) {
            res.status(403).json({message: 'unauthorized request'});
        } else {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({_id: req.params.id})
                    .then(() => { res.status(200).json({message: 'Sauce supprimée !'})})
                    .catch(error => res.status(error.statusCode).json({ error }));
            });
        }
    })
    .catch( error => {
        res.status(error.statusCode).json({ error });
    });
};

exports.likeSauce = (req, res) => {
  
  let valueLike = req.body.like;
  let userId = req.auth.userId
  let sauceId = req.params.id

  /** on recherche l'id de  la sauce */
  Sauce.findOne({ _id: sauceId })
    .then (sauce  => {
        const hasLiked = sauce.usersLiked.includes(userId)
        const hasDisliked = sauce.usersDisliked.includes(userId)
        const hasLikeOrDisliked = hasLiked || hasDisliked

        let update = null
        let msg = null

        /**L'utilisateur like une première fois */
        if (valueLike === 1 && !hasLikeOrDisliked) {
          update = { $inc: { likes : +1 }, $push: { usersLiked : userId}}
          msg = 'like ajouté'
        

        /** L'utilisateur dislike une première fois */
        } else if (valueLike === -1 && !hasLikeOrDisliked){
          update = { $inc: { dislikes : +1}, $push: { usersDisliked : userId}}
          msg = 'dislike ajouté'

        /** L'utilisateur supprime son like ou son dislike */  
        } else if (valueLike === 0 && hasLikeOrDisliked){
          
          /**L'utilisateur supprime son like */
          if (hasLiked){
            update = { $inc : { likes : -1}, $pull: { usersLiked : userId}}
            msg = 'like supprimé'

          /**L'utilisateur supprime son dislike */
          } else if (hasDisliked){
            update = { $inc : { dislikes : -1}, $pull: { usersDisliked : userId}}
            msg = 'dislike supprimé'
          }
        }

        /**Succès : Update de la base de donnée */
        if (update) {
          Sauce.updateOne(
            { _id: sauceId},
            update
          )
          .then(() => res.status(200).json({ message : msg}))
          .catch(error => res.status(error.statusCode).json({ error }))
        
        /**Echec : L'utilisateur a déjà voté */
        } else if (hasLikeOrDisliked) {
          res.status(400).json({ msg : 'Vous avez déjà noté cette sauce'})
        
        /**Echec : Autres cas (mauvaise valueLike ou suppression d'un like ou dislike inexistant) */
        } else {
          res.status(400).json({ msg : 'Une erreur est survenue'})
        }
    })

    /**Sauce non trouvée */
    .catch (error => {
      res.status(error.statusCode).json({ error })
    })
  }

