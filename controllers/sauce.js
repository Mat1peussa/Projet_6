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
    let like = req.body.like;
    let userId = req.auth.userId

    /** on recherche l'id de  la sauce */
    Sauce.findOne({ _id: req.params.id})
        .then (sauce  => {

                /** L'utilisateur like, on incrémente like et insert utilisateur dans le tableau des likes */
                if (
                    !sauce.usersLiked.includes(req.auth.userId)
                    && !sauce.usersDisliked.includes(req.auth.userId)
                    && like === 1
                ) {
                    Sauce.updateOne(
                        { _id: req.params.id},
                        { $inc: {likes : +1}, $push: {usersLiked : userId}}
                    )
                        .then(() => res.status(200).json({message : 'like ajouté'}))
                        .catch(error => res.status(error.statusCode).json({ error }));

                /** L'utilisateur dislike, on incrémente dislike et insert utilisateur dans le tableau des dislikes */
                } else if (
                    !sauce.usersLiked.includes(req.auth.userId)
                    && !sauce.usersDisliked.includes(req.auth.userId)
                    && like === -1
                ) {
                    Sauce.updateOne(
                        { _id: req.params.id},
                        { $inc: {dislikes : +1}, $push: {usersDisliked : userId}}
                    )
                        .then(() => res.status(200).json({message : 'dislike ajouté'}))
                        .catch(error => res.status(error.statusCode).json({ error }));

                /** L'utilisateur supprime son like */
                } else if (
                    sauce.usersLiked.includes(req.auth.userId)
                    && like === 0
                ) {
                    Sauce.updateOne(
                        { _id: req.params.id},
                        { $inc: {likes : -1},  $pull: {usersLiked : userId}})
                        .then(() => res.status(200).json({message : 'like retiré'}))
                        .catch(error => res.status(error.statusCode).json({ error }));

                /** L'utilisateur supprime son dislike */
                } else if (
                    sauce.usersDisliked.includes(req.auth.userId)
                    && like === 0
                ){
                    Sauce.updateOne(
                        { _id: req.params.id},
                        { $inc: {dislikes : -1},  $pull: {usersDisliked : userId}})
                        .then(() => res.status(200).json({message : 'dislike retiré'}))
                        .catch(error => res.status(error.statusCode).json({ error }));

                /** L'utilisateur tente de liker ou disliker une seconde fois */
                } else if (
                    sauce.usersLiked.includes(req.auth.userId)
                    || sauce.usersDisliked.includes(req.auth.userId)
                ) {
                    res.status(200).json({message : 'Vous avez deja voté'})

                /** L'utilisateur tente d'envoyer une mauvaise valeur */
                } else {
                    res.status(200).json({message : 'Mauvaise valeur pour like'})
                }
        })

        .catch (error  => {
            res.status(error.statusCode).json({ error })
        })
}
