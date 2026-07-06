const authModel = require('../models/authModel');
const bcrypt = require('bcrypt');

exports.signupPage = (req,res)=>{
    res.render('signup')
}

exports.signinPage = (req,res)=>{
    res.render('signin')
}

exports.signUp = (req,res)=>{
    const {name , email , password} = req.body;

    // console.log(name,email,password)
    if(!name || !email || !password)
    {
        // return res.render('signup',{
        //     error :'All fileds are required !!'
        // })

        return res.json({
            status : 'error',
            message : 'All Fields are Required'
        })
    }

    authModel.checkemail(email,(err,result)=>{
        if(err)
        {
            throw err;
        }
        if(result.length > 0)
        {
            // return res.render('signup',{
            //     error:'Email is already Exists !!'
            // })
            return res.json({
                status : 'error',
                message : 'Email is already Exists !!'
            })
        }

        
        bcrypt.hash(password,10,(err,hashpassword)=>{
            if(err)
            {
                throw err;
            }

            authModel.signUp(name,email,hashpassword,(err,result)=>{
                if(err)
                {
                    throw err;
                }
                // res.render('signup',{
                //     success:'You are sign Up Successfully'
                // })

                return res.json({
                    status : 'success',
                    message : 'You are sign Up Successfully'
                })
                
            })
        })
      
    })    
}


exports.signin = (req,res)=>{
    const {email,password} = req.body;

    if(!email || !password)
    {
        // return res.render('signin',{
        //     error : 'All fileds are Required !!'
        // })
        return res.json({
            status : 'error',
            message : 'All Fields are Required'
        })
    }

    authModel.checklogin(email,(err,result)=>{
        if(err)
        {
            throw err
        }

        if(result.length == 0)
        {
            // return res.render('signin',{
            //     error : 'Invalid Email !!'
            // })
            return res.json({
                status : 'error',
                message : 'Invalid Email !!'
            })
        }
        //  result[0].password    >>> means password of the First Data  
        // console.log(result[0].password);
        bcrypt.compare(password,result[0].password,(err,isMatch)=>{
            if(err)
            {
                throw err
            }
            if(!isMatch)
            {
                // return res.render('signin',{
                //     error : 'Invalid Password !!'
                // })
                return res.json({
                    status : 'error',
                    message : 'Invalid Password !!'
                })
            }

            req.session.user = result[0];

            authModel.setOnlineStatus(result[0].id, 1, (err) => {
                if(err) console.error("Failed to set online status:", err);
            });

            // res.send('Login Success ')
            return res.json({
                status : 'success',
                message : 'Login Successfully',
                redirect : '/user/home'
            })
        })



    })

    
}