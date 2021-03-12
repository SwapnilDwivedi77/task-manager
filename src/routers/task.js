const express = require('express')
const router = new express.Router()
const Tasks = require("../models/tasks")
const auth = require('../middleware/auth')



//GET /tasks?completed=true
// GET /tasks?limit=10&skip=false
// GET /tasks?sortBy=createdAt:desc

router.get('/tasks', auth, async (req, res) => {

    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy) {

        const parts = req.query.sortBy.split(':')

        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;

    }

    try {

        await req.user.populate({
            path: 'tasks',
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort 
            }
        }).execPopulate()


        res.send(req.user.tasks)


    } catch (error) {

        console.log(error)

        res.status(500).send(error);
    }


})



router.get('/tasks/:id', auth, async (req, res) => {

    const _id = req.params.id
    try {


        const tasks = await Tasks.findOne({ _id, owner: req.user._id })
        if (!tasks) return res.status(404).send("Record not found")
        res.send(tasks)

    } catch (error) {
        res.status(500).send(error)

    }


})

router.post("/create-task", auth, async (req, res) => {

    const task = new Tasks({
        ...req.body,
        owner: req.user._id
    })

    try {

        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send()
    }
});



router.patch('/tasks/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body)

    const allowedUpdates = ["description", "completed"]

    const isValidOperations = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperations) return res.status(400).send({ error: "Updates on invalid field!!" })



    try {

        const task = await Tasks.findOne({ _id: req.params.id, owner: req.user._id })



        if (!task) return res.status(404).send("Record not found ")
        updates.forEach((update) => task[update] = req.body[update])
        task.save()


        res.send(task)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)

    }
})

router.delete('/tasks/:id', auth, async (req, res) => {

    try {

        const deletedTask = await Tasks.findOneAndDelete({ _id: req.params.id, owner: req.user.id })

        if (!deletedTask) return res.status(404).send("record not found!!");


        res.send("User delted" + deletedTask)

    }
    catch (error) {

        res.status(500).send(error)

    }
})

module.exports = router