const express = require('express');
const formData = require('express-form-data');
const router = express.Router();  
const {
    calculateBaseTimeOnline,
    calculatePointSeen,
    calculatePointSeenNew,
    calculatePointOrder,
    calculatePointShareNew,
    calculatePointShareUser,
    // CalculatePointVoteNew,
    calculatePointNextPage,
    exchangePointHistory,
    updateEndTimeNextPage,
    exchangeNumberPoints,
    usePoint,
    changeIdChat,
    countComment,
    evaluateContentNew,
    startSee,
    endSee,
    takeUser,
    calculatePointNTDComment,
    historyAll,
    getOnsiteHistory,
    getCandidateSeen,
    getPointSeenUv,
    getListNewShare,
    getListUrlShare,
    getListUserShare,
    getListUvSeen,
    getListCommentNew,
    getListCommentNTD,
    getOnsiteData,
    getSaveExchangePoints,
    getAppliedList,
    handleHistoryLogin
} = require('../../controllers/timviec/history');
const functions = require("../../services/functions")

router.post('/calculateBaseTimeOnline',formData.parse() ,calculateBaseTimeOnline);
router.post('/calculatePointSeen',formData.parse() ,calculatePointSeen); 
router.post('/calculatePointSeenNew',formData.parse() ,calculatePointSeenNew); 
router.post('/calculatePointOrder',formData.parse() ,calculatePointOrder);
router.post('/calculatePointShareNew',formData.parse() ,calculatePointShareNew);
router.post('/calculatePointShareUser',formData.parse() ,calculatePointShareUser);
// router.post('/calculatePointVoteNew',formData.parse() ,calculatePointVoteNew);
router.post('/calculatePointNextPage',formData.parse() ,calculatePointNextPage);
router.post('/exchangePointHistory',formData.parse() ,exchangePointHistory);
router.post('/updateEndTimeNextPage',formData.parse() ,updateEndTimeNextPage);
router.post('/exchangeNumberPoints',formData.parse() ,exchangeNumberPoints);
router.post('/usePoint',formData.parse() ,usePoint);
router.post('/changeIdChat',formData.parse() ,changeIdChat);
router.post('/countComment',formData.parse() ,countComment);
router.post('/evaluateContentNew',formData.parse() ,evaluateContentNew);
router.post('/startSee',formData.parse() ,startSee);
router.post('/endSee',formData.parse() ,endSee);
router.post('/calculatePointNTDComment',formData.parse() ,calculatePointNTDComment);
router.get('/takeUser/:userId' ,takeUser);

router.post('/historyAll', formData.parse(), historyAll);
router.post("/getOnsiteHistory", formData.parse(), getOnsiteHistory);
router.post("/getCandidateSeen", formData.parse(), getCandidateSeen);
router.post("/getPointSeenUv", formData.parse(), getPointSeenUv);
router.post("/getListNewShare", formData.parse(), getListNewShare);
router.post("/getListUrlShare", formData.parse(), getListUrlShare);
router.post("/getListUserShare", formData.parse(), getListUserShare);
router.post("/getListUvSeen", formData.parse(), getListUvSeen);
router.post("/getListCommentNew", formData.parse(), getListCommentNew);
router.post("/getListCommentNTD", formData.parse(), getListCommentNTD);
router.post("/getOnsiteData", formData.parse(), getOnsiteData);
router.post("/getSaveExchangePoints", formData.parse(), getSaveExchangePoints);
router.post("/getAppliedList", formData.parse(), getAppliedList);
router.post("/handleHistoryLogin", formData.parse(), handleHistoryLogin);


module.exports = router;