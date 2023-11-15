if (process.env.NODE_ENV != 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require("path");
const  session = require('express-session');
const flash = require("connect-flash");
const passport = require('passport');
const localStrategy = require('passport-local');
const MongoStore = require('connect-mongo');
const User = require('./models/user.js')
const { saveRedirectUrl }= require('./middleware');
const ejsMate = require('ejs-mate');
app.engine('ejs', ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded( {extended : true} ))
const { Session } = require("inspector");

const mongodb = " mongodb+srv://srajantiwari07:nflvEF1aiHgvVZYt@cluster0.szst4fh.mongodb.net/?retryWrites=true&w=majority";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(mongodb);
}
const store = MongoStore.create({
  mongoUrl: mongodb,
  crypto: {
    secret: 'mysecertcode'
  },
  touchAfter :24 * 3600

})
store.on('error',()=>{
  console.log("error in mongo session store",err)
})
const sessionOptions = {
    store: store,
    secret: 'mysecertcode',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      expires:Date.now() + 7*24*60*60 * 1000,
      maxAge:7*24*60*60 * 1000,
      httpOnly:true,
     },
  };
  

  app.use(session(sessionOptions));
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new localStrategy(User.authenticate()));
  
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  
  
  
  
  app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
  });
 

  app.get('/signup',(req,res)=>{
    res.render('Signup');
  })
  class MissingUsernameError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MissingUsernameError';
    }
}
  app.post('/signup', async (req, res) => {
    try {
    
        let { email, username, password } = req.body;

        // Validate if username is present
        if (!username) {
            throw new MissingUsernameError('No username was given'); 
        }

        const newUser = new User({email, username });

        const registerUser = await User.register(newUser, password);

        
        req.login(registerUser, (err) => {
            if (err) {
                console.log(err);
                return next(err);
            }

            req.flash("success", "Welcome to cloud project");
            res.redirect("/dash");
        });
    } catch (error) {
        console.log(error);
        // Handle the error appropriately, perhaps send a response to the client
    }
});

         
         
app.post('/login', passport.authenticate('local', {
 
  // successRedirect: '/dash',
  
  failureRedirect: '/login',
  failureFlash: true,
}), (req, res) => {
  // This function will be called if authentication is successful.
  req.flash('success', 'Successfully logged in');
  res.redirect('/dash');
});


 app.get('/logout',  (req,res,next)=>{
    req.logout((err)=>{
        if(err){
           return  next(err);
        }
        req.flash("success","you are succesfully logout ! ");
        res.redirect('/dash');
    })
})
  app.get('/login',(req,res)=>{
    res.render('login', { flash: req.flash() });
  })
  app.get('/dash',(req,res)=>{
    res.render('dashb');
  });
app.listen(8080,() => {
    console.log("server listening to port 8080");
}) 
