const sgMail = require('@sendgrid/mail')



sgMail.setApiKey(process.env.SEND_GRID_API_KEY)

const sendWelcomeEmail = (email, name) => {

    try {
        sgMail.send({
            to: email,
            from: "swapnildwivedi7@gmail.com",
            subject: "Welcome!!",
            text: ` Welcome to the app ${name} Hope you enjoy your time with us!!`
        })
    } catch (error) {
        console.log(error)
    }
}

const sendCancelationEmail = (email, name) => {

    try {
        sgMail.send({
            to: email,
            from: "swapnildwivedi7@gmail.com",
            subject: "Feedback on leaving",
            text: ` Hi ${name}, Hope you enjoyed our app, please do let us know why you chose to quit it would be great in improving our product!!`
        })
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    sendWelcomeEmail, sendCancelationEmail
}

