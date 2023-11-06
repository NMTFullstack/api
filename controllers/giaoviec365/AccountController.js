// const company = require('../models/company')

class AccountController 
{
    choose_login(req, res, next){
        res.send(res.json({
            message: 'Render view lựa chọn đăng nhập'
        }))
    }

    choose_register(req, res, next){
        res.send(res.json({
            message: 'Render view lựa chọn đăng kí'
        }))
    }

    view_login_member(res){
        res.send(res.json({
            massage: 'Render view đăng nhập nhân viên'
        }))
    }

    view_login_company(res){
        res.send(res.json({
            massage: 'Render view đăng nhập công ty'
        }))
    }
    
    register_company(res){
        res.send(res.json({
            message: 'View đăng kí công ty'
        }))
    }
    register_member(res){
        res.send(res.json({
            message: 'view đăng kí nhân viên'
        }))
    }

    forgot_pass(res){
        res.send(res.json({
            massage: 'view quên mật khẩu'
        }))
    }

    get_pass(res){
        res.send(res.json({
            massage: 'đổi mật khẩu'
        }))
    }
    register_complete(res){
        res.send(res.json({
            massage: 'Đăng kí thành công'
        }))
    }

    verification_register(res){
        res.send(res.json({
            massage: 'view xác thực đăng kí'
        }))
    }

    get_pass_complete(res){
        res.send(res.json({
            massage: 'khôi phục mật khẩu thành công'
        }))
    }

    verification_account(res){
        res.send(res.json({
            massage: 'nhập mã xác minh'
        }))
    }

}
module.exports = new AccountController()