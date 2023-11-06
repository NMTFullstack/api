const router = require('express').Router();


const toolVanThu = require("../../controllers/tools/vanthu");
router.post('/toolCateDexuat', toolVanThu.toolCateDeXuat);
// router.post('/toolDeXuat', toolVanThu.toolDeXuat);
router.post('/toolDeXuatXuLy', toolVanThu.toolDeXuatXuLy);
router.post('/toolDeleteDeXuat', toolVanThu.toolDeleteDX);
router.post('/toolGhiChu', toolVanThu.toolGhiChu);
router.post('/toolGroupVanBan', toolVanThu.toolGroupVanBan);
router.post('/toolHideCateDX', toolVanThu.toolhideCateDX);
router.post('/toolHistoryHandlingDX', toolVanThu.toolHistoryHDX);
router.post('/toolLyDo', toolVanThu.toolLyDo);
router.post('/toolPhongBan', toolVanThu.toolPhongBan);
router.post('/toolSettingDX', toolVanThu.toolSettingDX);
router.get('/tooltblfeedback',toolVanThu.tooltblFeedback)
router.get('/tblqlcvedit',toolVanThu.tool_qlcv_edit)
router.get('/tblqlcvrole',toolVanThu.tool_qlcv_role);
router.get('/tblqlycongvan',toolVanThu.tool_qlcv_congVan);
router.post('/hidecatedx',toolVanThu.toolhideCateDX);
router.get('/tblthaythe',toolVanThu.tool_VanBanThayThe);
router.get('/textbook',toolVanThu.tool_textBook);
router.get('/tlluutru',toolVanThu.tool_tlLuuTru);
router.get('/tlthongbao',toolVanThu.tool_ThongBao);
router.get('/userduyetvb',toolVanThu.tool_NguoiDuyetVB);
router.get('/usermodel',toolVanThu.tool_userModel);
router.get("/vanban",toolVanThu.tool_VanBan);
router.get("/tblview",toolVanThu.tool_View)
module.exports = router;