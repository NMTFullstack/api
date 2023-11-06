var express = require('express');
var router = express.Router();
var blog = require('../../controllers/raonhanh365/blog');
var formData = require('express-form-data');
const functions = require('../../services/functions');

//truoc dang nhap va sau dang nhap
router.post('/listBlog', formData.parse(), blog.getListBlogByFields);

//admin-------------------------------

//api lay ra danh sach blog theo cac truong
router.post('/getBlog', formData.parse(), blog.getListBlogByFields);

//api admin tao blog
router.post('/createBlog', formData.parse(), [functions.checkToken], blog.getAndCheckData, blog.createBlog);

//api admin cap nhat blog
router.put('/updateBlog', formData.parse(), [functions.checkToken, functions.isAdminRN365], blog.getAndCheckData ,blog.updateBlog);

//api xoa 1 blog by id hoac xoa tat ca
router.delete('/deleteBlog', [functions.checkToken, functions.isAdminRN365], blog.deleteBlog);

//api get anh trong chi tiet bai viet
router.post('/detailBlog', formData.parse(), blog.getDetailBlog);

// api tạo token User
router.post('/userToken', formData.parse(), blog.createToken);

module.exports = router;