//installer express : système de routage entre mongoose et application
const express = require('express');
//installer mongoose(base de données)
const mongoose = require('mongoose');
const sauceRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');
const path = require('path');
//module sans dépendance qui charge les variables d'environnement en dehors du programme 
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(express.json());


// gestion des CORS
app.use((req, res, next) => {
    //permet d'accéder à notre API depuis n'importe quelle origine
    res.setHeader('Access-Control-Allow-Origin', '*');
    //permet d'ajouter les headers mentionnés aux requêtes envoyées vers notre API
    res.setHeader(
        'Access-Control-Allow-Headers', 
        'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    //permet d'envoyer des requêtes avec les méthodes mentionnées
    res.setHeader(
        'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });


app.use('/api/sauces', sauceRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));


/** 
 * suppression du warning à la connexion
*/
mongoose.set('strictQuery', true); 


/**
 * se connecter à MongoDB
 */
mongoose.connect(
    `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.dg9ne4h.mongodb.net/piiquante?retryWrites=true&w=majority`,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  //on log l'erreur mais on ne bloque pas l'application en cas d'échec de connexion
  .catch(() => console.log('Connexion à MongoDB échouée !'));

module.exports = app;