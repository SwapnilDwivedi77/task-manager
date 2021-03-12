const express = require("express")
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/accounts')



router.post("/users", async (req, res) => {
    const user = new User(req.body);

    try {

        await user.save()
        await sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user });

        // sendWelcomeEmail(user.email, user.name)
    } catch (error) {
        res.status(400).send("Some error occured " + error);
    }
});



router.post('/users/login', async (req, res) => {

    try {

        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user })

    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {

    try {

        req.user.tokens = req.user.tokens.filter((token) => {

            return token.token !== req.token
        })

        await req.user.save();
        res.send();

    } catch (e) {

        res.status(500).send(e);
    }


})

router.post('/users/logoutAll', auth, async (req, res) => {

    try {

        req.user.tokens = []

        await req.user.save();
        res.send();

    } catch (e) {

        res.status(500).send(e);
    }


})


router.get('/users/me', auth, async (req, res) => {


    res.send(req.user)
})

router.get('/', auth, async (req, res) => {


    res.send("This is task manager!!")
})



router.patch('/users/me', auth, async (req, res) => {


    const updates = Object.keys(req.body)

    const allowedUpdates = ['name', 'email', 'password', 'age']

    const isValidOperations = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperations) {
        return res.status(400).send({ error: "Invalid updates parameter!!" })
    }

    try {


        updates.forEach((update) => req.user[update] = req.body[update])
        req.user.save()


        res.send(req.user);
    } catch (error) {

        res.status(400).send(error)

    }
})

router.delete('/users/me', auth, async (req, res) => {

    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send({ user: req.user })

    } catch (error) {

        res.status(500).send(error)


    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image.'))
        }

        return cb(undefined, true)
    }

})

router.post('/users/me/avatar/', auth, upload.single('upload'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

    req.user.avatar = buffer

    await req.user.save()
    res.send();
}, (error, req, res, next) => {

    res.status(400).send({ error: "Please upload an image" })
})

router.delete('/users/me/avatar', auth, async (req, res) => {

    try {
        req.user.avatar = undefined
        await req.user.save()
        res.send();
    }
    catch {
        res.status(500).send();
    }
})

router.get('/user/:id/avatar', auth, async (req, res) => {

    try {



        if (!req.user || !req.user.avatar) throw new Error()

        res.set('Content-Type', 'image/png')
        res.send(req.user.avatar)

    } catch (error) {

        res.status(404).send()

    }
})

module.exports = router