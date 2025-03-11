require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for Attendee Management'))
.catch(err => console.error('MongoDB connection failed:', err));

const attendeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketsBooked: { type: Number, required: true, min: 1 },
    preferences: {
        meal: { type: String, enum: ['vegan', 'vegetarian', 'non-vegetarian'], default: 'vegetarian' },
    }
});

const Attendee = mongoose.model('Attendee', attendeeSchema);

const attendeeValidation = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    event: Joi.string().required(),
    ticketsBooked: Joi.number().integer().min(1).required(),
});

const attendeePreferenceValidation = Joi.object({
    meal: Joi.string().valid('vegan', 'vegetarian', 'non-vegetarian'),
});

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(403).json({ message: 'access denied, no token provided' });

    const tokenWithoutBearer = token.split(' ')[1];

    if (!tokenWithoutBearer) {
        return res.status(403).json({ message: 'invalid token format' });
    }

    try {
        const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'invalid token' });
    }
};


const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'insufficient permissions!' });
        }
        next();
    };
};

app.post('/api/auth/login', (req, res) => {
    const { username, role } = req.body;

    if (!username || !role) {
        return res.status(400).json({ message: 'username and role are required' });
    }

    const token = jwt.sign({ username, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
});

// To register attendees
app.post('/api/attendees', authenticateJWT, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { error } = attendeeValidation.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, email, phone, event, ticketsBooked } = req.body;
        const newAttendee = new Attendee({ name, email, phone, event, ticketsBooked });
        await newAttendee.save();

        res.status(201).json({ message: 'attendee successfully registered', attendee: newAttendee });
    } catch (err) {
        res.status(500).json({ message: 'error registering attendee', error: err.message });
    }
});

app.get('/api/attendees/:id', authenticateJWT, async (req, res) => {
    console.log('Attendee ID:', req.params.id); 
    try {
        const attendee = await Attendee.findById(req.params.id);
        if (!attendee) {
            return res.status(404).json({ message: 'Attendee not found' });
        }
        res.json(attendee);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching attendee details', error: err.message });
    }
});



app.patch('/api/attendees/:id/preferences', authenticateJWT, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { error } = attendeePreferenceValidation.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { meal } = req.body;

        const attendee = await Attendee.findById(req.params.id);
        if (!attendee) return res.status(404).json({ message: 'attendee not found' });

        if (meal) attendee.preferences.meal = meal;

        await attendee.save();

        res.json({ message: 'attendee meal preference updated', preferences: attendee.preferences });
    } catch (err) {
        res.status(500).json({ message: 'error updating preferences', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Attendee Management Service is running on port ${PORT}`);
});
