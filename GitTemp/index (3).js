require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for Ticket Booking'))
.catch(err => console.error('MongoDB connection failed:', err));

const ticketBookingSchema = new mongoose.Schema({
    attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendee', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketsBooked: { type: Number, required: true, min: 1 },
    bookingDate: { type: Date, default: Date.now },
});

const TicketBooking = mongoose.model('TicketBooking', ticketBookingSchema);

const ticketBookingValidation = Joi.object({
    attendeeId: Joi.string().required(),
    eventId: Joi.string().required(),
    ticketsBooked: Joi.number().integer().min(1).required(),
    paymentInfo: Joi.object({
        amount: Joi.number().required(),
        transactionId: Joi.string().required(),
    }).required()
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

const processPayment = async (amount, transactionId) => {
    try {
        
        const generatedTransactionId = transactionId || `txn_${Date.now()}`;
        console.log(`processing payment of amount: $${amount} with transaction ID: ${generatedTransactionId}`);
        
        return { status: 'completed', transactionId: generatedTransactionId };

    } catch (err) {
        throw new Error('payment processing failed: ' + err.message);
    }
};


const checkEventAvailability = async (eventId, ticketsBooked, token) => {
    try {
        console.log("making request to Event Management Service...");
        const response = await axios.get(`http://localhost:5001/api/events/${eventId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log('Event Service Response:', response.data);
        const event = response.data;
        if (event.ticketAvailability < ticketsBooked) {
            throw new Error('not enough tickets available');
        }
    } catch (err) {
        console.error('Error fetching event data:', err.message); // Log the error message
        throw new Error('error fetching event data: ' + err.message);
    }
};


const validateAttendee = async (attendeeId) => {
    try {
        const response = await axios.get(`http://localhost:5002/api/attendees/${attendeeId}`);
        const attendee = response.data;
        if (!attendee || !attendee.isRegistered) {
            throw new Error('attendee is not registered');
        }
    } catch (err) {
        throw new Error('error validating attendee: ' + err.message);
    }
};

app.post('/api/tickets', authenticateJWT, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { error } = ticketBookingValidation.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { attendeeId, eventId, ticketsBooked, paymentInfo } = req.body;

        const paymentResult = await processPayment(paymentInfo.amount, paymentInfo.transactionId);
        
        if (paymentResult.status !== 'completed') {
            return res.status(400).json({ message: 'payment failed' });
        }

        await checkEventAvailability(eventId, ticketsBooked);

        await validateAttendee(attendeeId);

        const newTicketBooking = new TicketBooking({ attendeeId, eventId, ticketsBooked });
        await newTicketBooking.save();

        await axios.patch(`http://event-management-service/api/events/updateTickets`, {
            eventId,
            tickets: ticketsBooked
        });

        res.status(201).json({ message: 'ticket successfully booked', ticketBooking: newTicketBooking });
    } catch (err) {
        res.status(500).json({ message: 'error booking ticket', error: err.message });
    }
});

app.get('/api/tickets/:id', authenticateJWT, async (req, res) => {
    try {
        const ticket = await TicketBooking.findById(req.params.id).populate('attendeeId eventId');
        if (!ticket) return res.status(404).json({ message: 'ticket not found' });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: 'error fetching ticket booking details', error: err.message });
    }
});
// for viewing booking history:
app.get('/api/tickets', authenticateJWT, async (req, res) => {
    try {
        const tickets = await TicketBooking.find().populate('attendeeId eventId');
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: 'error fetching ticket bookings', error: err.message });
    }
});

app.patch('/api/tickets/updateTickets', authenticateJWT, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { ticketBookingId, tickets } = req.body;
        if (!ticketBookingId || !tickets) return res.status(400).json({ message: 'ticket booking ID and tickets are required' });

        const ticket = await TicketBooking.findById(ticketBookingId);
        if (!ticket) return res.status(404).json({ message: 'ticket booking not found' });

        ticket.ticketsBooked += tickets;
        await ticket.save();

        res.json({ message: 'updated', ticket });
    } catch (err) {
        res.status(500).json({ message: 'error updating! ', error: err.message });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'an internal server error occurred', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Ticket Booking Service is running on port ${PORT}`);
});
