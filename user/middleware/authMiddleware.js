const checkUser = (req,res,next) => {
    if(!req.session.user)
    {
        return res.redirect('/user/signin')
    }
    next();
}

module.exports = {checkUser}