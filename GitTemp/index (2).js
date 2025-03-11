require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const Joi = require('joi');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true,
    useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB for Event Management'))
.catch(err => console.error('MongoDB connection failed:', err));

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    ticketAvailability: { type: Number, required: true, min: 0 },
});

const Event = mongoose.model('Event', eventSchema);

const eventValidation = Joi.object({
    name: Joi.string().required(),
    location: Joi.string().required(),
    date: Joi.date().required(),
    ticketAvailability: Joi.number().integer().min(0).required(),
});

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(403).json({ message: 'Access denied, no token provided' });

    const tokenWithoutBearer = token.split(' ')[1];

    if (!tokenWithoutBearer) {
        return res.status(403).json({ message: 'Invalid token format' });
    }

    try {
        const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
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

app.post('/api/events', authenticateJWT, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { error } = eventValidation.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, location, date, ticketAvailability } = req.body;
        const newEvent = new Event({ name, location, date, ticketAvailability });
        await newEvent.save();

        res.status(201).json({ message: 'event successfully created', event: newEvent });
    } catch (err) {
        res.status(500).json({ message: 'error creating event', error: err.message });
    }
});

app.get('/api/events/:id', authenticateJWT, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'event not found' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: 'error fetching event details', error: err.message });
    }
});

app.get('/api/events', authenticateJWT, async (req, res) => {
    try {
        const events = await Event.find({ ticketAvailability: { $gt: 0 } });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'error fetching events list', error: err.message });
    }
});

app.patch('/api/events/updateTickets', authenticateJWT, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { eventId, tickets } = req.body;
        if (!eventId || !tickets) return res.status(400).json({ message: 'event ID and tickets are required' });

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'event not found' });

        if (event.ticketAvailability < tickets) {
            return res.status(400).json({ message: 'not enough tickets available' });
        }

        event.ticketAvailability -= tickets;
        await event.save();

        res.json({ message: 'ticket availability updated', event });
    } catch (err) {
        res.status(500).json({ message: 'error updating ticket availability', error: err.message });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'an internal server error occurred', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Event Management Service is running on port ${PORT}`);
});
