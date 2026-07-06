// Admin Login Middleware 

module.exports = (req,res,next)=>{
    if(!req.session.admin)
    {
        return res.redirect('/admin')
    }
    res.locals.admin = req.session.admin;
    next();
}