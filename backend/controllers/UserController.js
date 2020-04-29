const UserModel = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    jwt_auth_secret
} = require('../config/keys');
const UserController = {
    getAll(req,res) {
        UserModel.find()
        .populate('followers')
        .populate('following')
        .then(users=>res.send(users))
        .catch(console.error)
    },
    async register(req, res) {
        try {
            req.body.password = await bcrypt.hash(req.body.password, 9)
            const user = await UserModel.create(req.body);
            res.status(201).send({
                user,
                message: 'Usuario creado con éxito'
            })
        } catch (error) {
            console.error(error)
            res.status(500).send({
                message: 'Hubo un problema al intentar registrar al usuario',
                error
            })
        }
    },
    getInfo(req, res) {
        UserModel.findById(req.user._id)
            .populate('followers')
            .populate('following')
            .then(user => res.send(user))
            .catch(console.error);
    },
    async follow(req, res) {
        try {
            const isSameUser = req.params.user_id === '' + req.user._id;
            const isAlreadyFollowingUser = req.user.following.includes(req.params.user_id);
            if (!isAlreadyFollowingUser && !isSameUser) {
                await UserModel.findByIdAndUpdate(req.user._id, {
                    $push: {
                        following: req.params.user_id
                    }
                });
                await UserModel.findByIdAndUpdate(req.params.user_id, {
                    $push: {
                        followers: req.user._id
                    }
                });
            }
            res.send(req.user)
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: 'There was a problem trying to follow'
            })
        }
    },
    async login(req, res) {
        try {
            const user = await UserModel.findOne({
                email: req.body.email
            });
            if (!user) {
                return res.status(400).send({
                    message: 'Email o contraseña incorrectos'
                })
            }
            const isMatch = bcrypt.compare(req.body.password, user.password);
            if (!isMatch) {
                return res.status(400).send({
                    message: 'Email o contraseña incorrectos'
                })
            }
            const token = jwt.sign({
                _id: user._id
            }, jwt_auth_secret);
            if (user.tokens.length > 4) user.tokens.shift();
            user.tokens.push(token);
            await user.replaceOne(user);
            res.send({
                user,
                token,
                message: 'Conectado con éxito'
            })
        } catch (error) {
            console.error(error)
            res.status(500).send({
                message: 'Hubo un problema al intentar conectar al usuario'
            })
        }
    }
}

module.exports = UserController;