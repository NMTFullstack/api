const router = require("express").Router()
const controller = require("../../../controllers/crm/Contract/formContract")
const formData = require("express-form-data")

const functions= require ("../../../services/functions")


//Api thêm hợp đồng
router.post("/add",functions.checkToken,formData.parse(), controller.addContract)

// Api Hiển thị danh sách hợp đồng
router.post("/list",functions.checkToken,formData.parse(), controller.list)

//Api sửa hợp dồng
router.post("/edit",functions.checkToken,formData.parse(), controller.editContract)

//Api hiển thị xóa loại hợp đồng
router.delete("/delete",functions.checkToken,formData.parse(), controller.deleteContract)

//Api xóa hợp đồng bán
router.delete("/delete/detail",functions.checkToken,formData.parse(), controller.deleteDetailContract)
module.exports = router