require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const port = process.env.PORT || 5000;
const app = express();
const { signup, login } = require("./Authentication/authentication");
const AuthenticationToken = require("./MiddlewareToken/AuthenticationToken");
const addEvent = require("./Events/AddEvent");
const AddRequest = require("./Requests/AddRequest");
const PDFDocument = require('pdfkit');
app.use(express.json());
app.use(cors());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
pool.connect()
    .then(() => {
        console.log("Database connected");
    })
    .catch((error) => {
        console.log("Database connection error:", error);
    });

app.post('/signup', signup);
app.post('/login', login);
app.post("/addEvent", AuthenticationToken, addEvent);

//get events from api
app.get("/events", async (req,res)=>{
    try
    {
        const result = await pool.query(
            `SELECT events.*, users.name as creator_name
             FROM events
             JOIN users ON events.created_by = users.id
             ORDER BY events.created_at DESC
            `
        );
        res.json({events: result.rows});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
})

// added user to event join list

app.post('/events/:eventId/join', AuthenticationToken, async(req,res)=>{
    try
    {
        const {eventId} = req.params;
        const userId = req.user.id;
        const existingUser = await pool.query(
            "SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2",
            [eventId, userId]
        );
        if(existingUser.rows.length > 0)
        {
            return res.status(400).json({
                success: false,
                message: "You have already joined the event"
            });
        }
        await pool.query(
            "INSERT INTO event_attendees(event_id, user_id) VALUES ($1, $2)",
            [eventId, userId]
        )
        res.json
        ({
            success: true,
            message: "joined the event successfully"
        });
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
})

// single event details
app.get('/events/:eventId', async(req,res)=>{
    try
    {
        const {eventId} = req.params;
        const result = await pool.query(
            `SELECT events.*, users.name as creator_name
             FROM events
             JOIN users ON events.created_by = users.id
             WHERE events.id = $1
            `,
            [eventId]
        );
        if(result.rows.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }
        res.json({event: result.rows[0]});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
})

// find out attendance list
app.get('/events/:eventId/attendees', async(req,res)=>{
    try
    {
        const {eventId} = req.params;
        const result = await pool.query(
            `SELECT users.id, users.name, users.email, event_attendees.joined_at
            FROM event_attendees
            JOIN users ON event_attendees.user_id = users.id
            WHERE event_attendees.event_id = $1
            ORDER BY event_attendees.joined_at DESC
            `,
            [eventId]
        );
        res.json({attendees: result.rows});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
})
// Community Help Request Starts here
app.post('/addRequest', AuthenticationToken, AddRequest);

// get request from db
app.get('/requests', async(req,res)=>{
    try
    {
        const result = await pool.query
        (
            `SELECT help_requests.*, users.name as creator_name
            FROM help_requests
            JOIN users ON help_requests.created_by = users.id
            ORDER BY help_requests.created_at DESC
            `
        );
        res.json({requests: result.rows});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
})
app.get("/", (req, res) => {
    res.send("Hello World");
});

// Store help response to db
app.post('/requests/:requestId/response', AuthenticationToken, async(req,res)=>{
    try
    {
        const {requestId} = req.params;
        const userId = req.user.id;
        const existingUser = await pool.query
        (
            "SELECT * FROM help_offers WHERE request_id = $1 AND user_id = $2",
            [requestId, userId]
        );
        if(existingUser.rows.length > 0)
        {
            return res.status(400).json
            ({
                success: false,
                message: "You have already responded to this Community"
            });
        }
        await pool.query
        (
            "INSERT INTO help_offers(request_id, user_id) VALUES ($1, $2)",
            [requestId, userId]
        )
        res.json
        ({
            success: true,
            message: "Joined The Community Successfully"
        });
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json
        ({
            success: false,
            message: "Internal server error"
        });
    }
})
//single community member
app.get('/requests/:requestId', async(req,res)=>{
    try
    {
        const {requestId} = req.params;
        const result = await pool.query
        (
            `SELECT help_requests.*, users.name as creator_name
            FROM help_requests
            JOIN users ON help_requests.created_by = users.id
            WHERE help_requests.id = $1
            `,
            [requestId]
        );
        if(result.rows.length === 0)
        {
            return res.status(404).json
            ({
                success: false,
                message: "Request not found"
            });
        }
        res.json({request: result.rows[0]});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json
        ({
            success: false,
            message: "Internal server error"
        });
    }
});

// Members list
app.get('/requests/:requestId/members', async(req,res)=>{
    try
    {
        const {requestId} = req.params;
        const result = await pool.query
        (
            `SELECT users.id, users.name, users.email,users.skills
            FROM help_offers
            JOIN users ON help_offers.user_id = users.id
            WHERE help_offers.request_id = $1
            `,
            [requestId]
        );
        res.json({members: result.rows});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json
        ({
            success: false,
            message: "Internal server error"
        });
    }
});

// user will get comments here

app.get("/requests/:requestId/comments", async(req,res)=>{
    try
    {
        const {requestId} = req.params;
        const result = await pool.query(
            `SELECT request_comments.*,commenter.name as user_name
            FROM request_comments
            JOIN users commenter ON request_comments.user_id = commenter.id
            WHERE request_comments.request_id = $1
            ORDER BY request_comments.created_at DESC
            `,
            [requestId]
        );
        res.json({comments: result.rows});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success:false,
            message: "Internal server error"
        })
    }
});

// user will post comments here

app.post("/requests/:requestId/comments",AuthenticationToken, async(req,res)=>{
    try
    {
        const {requestId} = req.params;
        const userId = req.user.id;
        const {content} = req.body;
        const result = await pool.query(
            `INSERT INTO request_comments (request_id, user_id, content) VALUES ($1, $2, $3) RETURNING *,
            (SELECT name FROM users WHERE id = $2) AS user_name`,
            [requestId, userId, content]
        );
        res.json({comment: result.rows[0]});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success:false,
            message: "Internal server error"
        })
    }
});


// User will add log hours for event

app.post("/events/:eventId/logHours", AuthenticationToken, async(req,res)=>{
    try
    {
        const {eventId} = req.params;
        const {hours} = req.body;

        const isAttendee = await pool.query
        (
            `SELECT * FROM event_attendees
            WHERE event_id = $1 AND user_id = $2`,
            [eventId, req.user.id]
        );

        if(isAttendee.rows.length === 0)
        {
            return res.status(400).json
            ({
                success: false,
                message: "Please join the event first"
            });
        }

        const result = await pool.query
        (
            `INSERT INTO volunteer_hours (user_id, event_id, hours)
            VALUES ($1, $2, $3) RETURNING *`,
            [req.user.id, eventId, hours]
        );

        await pool.query(
            `INSERT INTO user_points (user_id, total_points, total_hours)
             VALUES ($1, $2 * 5, $3)
             ON CONFLICT (user_id)
             DO UPDATE SET
             total_points = user_points.total_points + ($2 * 5),
             total_hours = user_points.total_hours + $3`,
            [req.user.id, hours, hours]
          );
        res.json({volunteerHours: result.rows[0]});

        const totalResult = await pool.query
        (
            `SELECT total_hours FROM user_points WHERE user_id = $1`,
            [req.user.id]
        );
        const totalHours = totalResult.rows[0].total_hours;
        const mileStones = [20,50,100,150,200];
        for(const milestone of mileStones)
        {
            if(totalHours >= milestone)
            {
                const certificateCheck = await pool.query
                (
                    `SELECT id FROM certificates WHERE user_id = $1
                    AND hours_milestone = $2`,
                    [req.user.id, milestone]
                );

                if(certificateCheck.rows.length === 0)
                {
                    await pool.query
                    (
                        `INSERT INTO certificates
                        (user_id, hours_milestone)
                        VALUES ($1, $2)`,
                        [req.user.id, milestone]
                    );
                }
            }
        }
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json
        ({
            success: false,
            message: "Internal server error"
        });
    }
});

//user will add log hours for community
app.post("/requests/:requestId/logHours", AuthenticationToken, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { hours } = req.body;
      const hasResponded = await pool.query(
        `SELECT * FROM help_offers 
         WHERE request_id = $1 AND user_id = $2`,
        [requestId, req.user.id]
      );
  
      if (hasResponded.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please join the community request first"
        });
      }
      await pool.query(
        `INSERT INTO volunteer_hours (user_id, request_id, hours)
         VALUES ($1, $2, $3)`,
        [req.user.id, requestId, hours]
      );
      await pool.query(
        `INSERT INTO user_points (user_id, total_points, total_hours)
         VALUES ($1, $2 * 5, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET
           total_points = user_points.total_points + ($2 * 5),
           total_hours = user_points.total_hours + $3`,
        [req.user.id, hours, hours]
      );
      const totalResult = await pool.query(
        `SELECT total_hours FROM user_points WHERE user_id = $1`,
        [req.user.id]
      );
      const totalHours = totalResult.rows[0].total_hours;
      const milestones = [20, 50, 100, 150, 200];
      
      for (const milestone of milestones) {
        if (totalHours >= milestone) {
          const certCheck = await pool.query(
            `SELECT id FROM certificates 
             WHERE user_id = $1 AND hours_milestone = $2`,
            [req.user.id, milestone]
          );
          
          if (certCheck.rows.length === 0) {
            await pool.query(
              `INSERT INTO certificates (user_id, hours_milestone)
               VALUES ($1, $2)`,
              [req.user.id, milestone]
            );
          }
        }
      }
  
      res.json({ success: true, message: "Hours logged successfully" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
// user view profile

app.get('/viewProfile', AuthenticationToken, async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);

      const [points, certificates] = await Promise.all([
        pool.query('SELECT * FROM user_points WHERE user_id = $1', [userId]),
        pool.query('SELECT * FROM certificates WHERE user_id = $1', [userId]),
      ]);
      
      res.json({
        points: points.rows[0] || { total_points: 0, total_hours: 0 },
        certificates: certificates.rows
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load profile" });
    }
  });

  // Certificate
app.get('/certificates/:certId', AuthenticationToken, async (req, res) => {
    try {
      const cert = await pool.query(
        `SELECT c.*, u.name 
         FROM certificates c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = $1`,
        [req.params.certId]
      );
  
      if (!cert.rows.length || cert.rows[0].user_id !== req.user.id) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=certificate-${req.params.certId}.pdf`);
      doc.pipe(res);
      doc.fontSize(25).text('Volunteer Certificate', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text(`Awarded to: ${cert.rows[0].name}`);
      doc.text(`For completing ${cert.rows[0].hours_milestone} volunteer hours`);
      doc.text(`Awarded on: ${new Date(cert.rows[0].awarded_at).toLocaleDateString()}`);
      doc.end();
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate certificate" });
    }
  });
  
//  leader detils will Show ...........
app.get('/leaderboard', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT users.id, users.name, 
               user_points.total_points,
               user_points.total_hours
        FROM user_points
        JOIN users ON user_points.user_id = users.id
        ORDER BY user_points.total_points DESC
        LIMIT 100
      `);
      res.json({ leaderboard: result.rows });
    } catch (err) {
      res.status(500).json({ error: "Failed to load leaderboard" });
    }
  });

//testing jwt route
app.get("/profile", AuthenticationToken, (req, res) => {
    res.json({user: req.user});
})
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});