import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//setting up database connection pool
const pool = mysql.createPool({
    host: "thh2lzgakldp794r.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "mxpdo1ihvf8l983k",
    password: "agu05cbiavbwcss5",
    database: "u18s8re7whtuwyf1",
    connectionLimit: 10,
    waitForConnections: true
});

//routes
app.get('/', (req, res) => {
   res.render('index')
});

app.get('/author/new', (req, res) => {
   res.render('newAuthor')
});

app.post("/author/new", async (req, res) => {
  let fName = req.body.fName;
  let lName = req.body.lName;
  let dob = req.body.dob;
  let dod = req.body.dod;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let portrait = req.body.portrait;
  let biography = req.body.biography;

  let sql = `
    INSERT INTO q_authors
    (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  let params = [fName, lName, dob, dod, sex, profession, country, portrait, biography];
  const [rows] = await pool.query(sql, params);
  res.render("newAuthor", {"message": "Author added!"});
});

app.get("/authors", async function(req, res){
 let sql = `SELECT *
            FROM q_authors
            ORDER BY lastName`;
 const [rows] = await pool.query(sql);
 res.render("authorList", {"authors":rows});
});

app.get("/author/edit", async function(req, res){
 let authorId = req.query.authorId;
 let sql = `SELECT *, 
        DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
        DATE_FORMAT(dod, '%Y-%m-%d') dodISO
        FROM q_authors
        WHERE authorId =  ${authorId}`;
 const [rows] = await pool.query(sql);
 res.render("editAuthor", {"authorInfo":rows});
});

app.post("/author/edit", async function(req, res){
  let sql = `UPDATE q_authors
            SET firstName = ?,
                lastName = ?,
                dob = ?,
                dod = ?,
                sex = ?,
                profession = ?,
                country = ?,
                portrait = ?,
                biography = ?
            WHERE authorId =  ?`;


  let params = [req.body.fName,  
              req.body.lName, req.body.dob, 
              req.body.dod, req.body.sex,
              req.body.profession,
              req.body.country, req.body.portrait,
              req.body.biography, req.body.authorId,];         
  const [rows] = await pool.query(sql,params);
  res.redirect("/authors");
});

app.get("/author/delete", async function(req, res){
 
  let authorId = req.query.authorId;

  let sql = `DELETE
            FROM q_authors
            WHERE authorId = ?`;
 const [rows] = await pool.query(sql, [authorId]);
 
 res.redirect("/authors");
});

app.get("/quotes", async function(req, res){
  let sql = `
    SELECT q.quoteId, q.quote, q.category, q.likes, 
           a.firstName, a.lastName
    FROM q_quotes q
    JOIN q_authors a ON q.authorId = a.authorId
    ORDER BY q.quoteId
  `;
  const [rows] = await pool.query(sql);
  res.render("quoteList", { quotes: rows });
});

app.get("/quote/new", async (req, res) => {
  const [authors] = await pool.query(`SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName`);
  const [categories] = await pool.query(`SELECT DISTINCT category FROM q_quotes ORDER BY category`);
  res.render("newQuote", { authors, categories });
});


app.post("/quote/new", async (req, res) => {
  let sql = `
    INSERT INTO q_quotes
    (quote, authorId, category, likes)
    VALUES (?, ?, ?, ?)
  `;
  let params = [req.body.quoteText, req.body.authorId, req.body.category, req.body.likes];
  const [rows] = await pool.query(sql, params);
  res.render("newQuote", {"message": "Quote added!"});
});

app.get("/quote/edit", async (req, res) => {
  let quoteId = req.query.quoteId;

  // Get quote
  let sqlQuote = `SELECT * FROM q_quotes WHERE quoteId = ?`;
  const [quoteRows] = await pool.query(sqlQuote, [quoteId]);

  // Get all authors
  let sqlAuthors = `SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName`;
  const [authorRows] = await pool.query(sqlAuthors);

  // Get all categories (distinct)
  let sqlCategories = `SELECT DISTINCT category FROM q_quotes ORDER BY category`;
  const [categoryRows] = await pool.query(sqlCategories);
  const categories = categoryRows.map(row => row.category);

  res.render("editQuote", {
    quoteInfo: quoteRows,
    authors: authorRows,
    categories: categories
  });
});



app.post("/quote/edit", async (req, res) => {
  let sql = `
  UPDATE q_quotes
  SET \`quote\` = ?,
      authorId = ?,
      category = ?,
      likes = ?
  WHERE quoteId = ?
`;

  let params = [
    req.body.quoteText,
    req.body.authorId,
    req.body.category,
    req.body.likes,
    req.body.quoteId
  ];

  await pool.query(sql, params);

  res.redirect("/quotes");
});

app.get("/quote/delete", async function(req, res){
 
  let quoteId = req.query.quoteId;

  let sql = `DELETE
            FROM q_quotes
            WHERE quoteId = ?`;
 const [rows] = await pool.query(sql, [quoteId]);
 
 res.redirect("/quotes");
});

app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});//dbTest

app.listen(3000, ()=>{
    console.log("Express server running")
})