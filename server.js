const express = require('express'); // The Chef's helper
const sqlite3 = require('sqlite3'); // The Notebook helper
const app = express();
const db = new sqlite3.Database('users.db'); // Create our notebook file

app.use(express.json()); // Teach the Chef to read digital notes
app.use(require('cors')()); // Allow the website to talk to the Chef

// Create the list if it's not there
db.run("CREATE TABLE IF NOT EXISTS members (name TEXT, email TEXT)");

// When the "Sign Up" button is pressed...
app.post('/signup', (req, res) => {
    const person = req.body;
    db.run("INSERT INTO members (name, email) VALUES (?, ?)", [person.name, person.email]);
    console.log("Wrote " + person.name + " into the notebook!");
    res.send({ status: "Saved!" });
});

// New "Look at the Notebook" door
app.get('/users', (req, res) => {
    db.all("SELECT * FROM members", [], (err, rows) => {
        res.send(rows);
    });
});

app.listen(3000, () => console.log("The Chef is ready at Port 3000!"));
