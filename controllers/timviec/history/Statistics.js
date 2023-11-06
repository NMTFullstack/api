const HistoryLogin = require("../../../models/Timviec365/UserOnSite/ManageHistory/HistoryLogin")
const HistoryPointPromotion = require("../../../models/Timviec365/UserOnSite/ManageHistory/HistoryPointPromotion")
const ManagerPointHistory = require("../../../models/Timviec365/UserOnSite/ManageHistory/ManagerPointHistory")
const SaveAccountVip = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveAccountVip")
const SaveExchangePoint = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveExchangePoint")
const SaveExchangePointBuy = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveExchangePointBuy")
const SaveExchangePointMoney = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveExchangePointMoney")
const SaveExchangePointOrder = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveExchangePointOrder")
const SaveNextPage = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveNextPage")
const SaveSeeNewByEm = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveSeeNewByEm")
const SaveSeeNewRequest = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveSeeNewRequest")
const SaveSeeRequest = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveSeeRequest")
const SaveShareSocialNew = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveShareSocialNew")
const SaveShareSocialUser = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveShareSocialUser")
const SaveVote = require("../../../models/Timviec365/SaveVote")
const NewTV365 = require("../../../models/Timviec365/UserOnSite/Company/New")
const PointUsed = require("../../../models/Timviec365/UserOnSite/Company/ManagerPoint/PointUsed")
const CommentPost = require("../../../models/Timviec365/UserOnSite/CommentPost")

const functions = require("../../../services/functions")
const Users = require("../../../models/Users")

const ONE_DAY_IN_SECONDS = 60*60*24;

const reformatShareData = (list) => {
    if (!list) return [];
    list = [...list];
    let shareObject = {
        chat365: 0,
        facebook: 0,
        twitter: 0,
        vkontakte: 0,
        linkedin: 0,
    }
    list.forEach(sharedNew => {
        let shares = {...shareObject};
        if (sharedNew.shares&&sharedNew.shares.length) {
            sharedNew.shares.forEach(share => {
                shares[share.socialName] = share.count;
            })
        }
        sharedNew.shares = shares;
    })
    return list;
}

const getOnsiteHistory = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        dateFrom = dateFrom?Number(new Date(dateFrom).getTime()/1000):0;
        dateTo = (dateTo?Number(new Date(dateTo).getTime()/1000):Number(new Date().getTime()/1000)) + ONE_DAY_IN_SECONDS;
        //console.time("getOnsiteHistory");
        let list = await HistoryLogin.find({
            userId,
            type,
            timeLogin: {$gte: dateFrom, $lte: dateTo},
        }).sort({id: -1}).skip(skip).limit(limit);
        let totalAggregate = await HistoryLogin.aggregate([
            {
                $match: {
                    userId: userId,
                    type: type,
                    timeLogout: {$ne: 0},
                    timeLogin: {$gte: dateFrom, $lte: dateTo},
                }
            },

            {
                $group: {
                    _id: null,
                    total: {$sum: {$subtract: ["$timeLogout", "$timeLogin"]}},
                    count: {$sum: 1}
                }
            }
        ])

        let total = (totalAggregate[0]?totalAggregate[0].total:0);
        let count = (totalAggregate[0]?totalAggregate[0].count:0);
        //console.timeEnd("getOnsiteHistory");
        return {list:list?list:[], total:total?total:0, count:count?count:0}
    } catch (error) {
        console.log("getOnsiteHistory", error)
        return null;
    }
}

const getCandidateSeen = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getCandidateSeen");
        dateFrom = dateFrom?Number(new Date(dateFrom).getTime()/1000):0;
        dateTo = (dateTo?Number(new Date(dateTo).getTime()/1000):Number(new Date().getTime()/1000)) + ONE_DAY_IN_SECONDS;
        let aggrData = await SaveSeeRequest.aggregate([
            {
                $match: {
                    userId: userId,
                    type: type,
                    userIdBeSeen: {$gt: 0},
                    time: {$gte: dateFrom, $lte: dateTo}
                }
            },
            {
                $sort: {
                   id: -1 
                }
            },
            {
                $lookup : {
                    from : "Users",
                    localField : "userIdBeSeen",
                    foreignField : "idTimViec365",
                    as : "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $facet: {
                    counter: [{$count: "count"}],
                    list: [
                        {
                            $skip: skip
                        },
                        {
                            $limit: limit
                        },
                        {
                            $project: {
                                "id": "$id",
                                "userId": "$userId",
                                "type": "$type",
                                "userIdBeSeen": "$userIdBeSeen",
                                "typeIdBeSeen": "$typeIdBeSeen",
                                "time": "$time",
                                "cv_cate_id": "$user.inForPerson.candidate.cv_cate_id",
                                "use_city": "$user.city",
                                "first_name": "$user.userName",
                                "use_id": "$user.idTimViec365",
                            }
                        }
                    ]
                }
            }
        ]);
        let list = 0;
        let total = 0;
        if (aggrData[0]&&aggrData[0].counter[0]) {
            list = aggrData[0].list;
            total = aggrData[0].counter[0].count;
        }
        //console.timeEnd("getCandidateSeen");
        return {list:list?list:[], total:total?total:0};
    } catch (error) {
        console.log("getCandidateViews", error)
        return null;
    }
}

const getPointSeenUv = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        dateFrom = dateFrom?Number(new Date(dateFrom).getTime()/1000):0;
        dateTo = (dateTo?Number(new Date(dateTo).getTime()/1000):Number(new Date().getTime()/1000)) + ONE_DAY_IN_SECONDS;
        //console.time("getPointSeenUv");
        let total = await PointUsed.find({
            usc_id: userId,
            used_day: {$gt: 1687315166},
            use_id: {$ne: 0},
            used_day: {$gte: dateFrom, $lte: dateTo}
        }).count();
        let aggrData = await SaveExchangePointBuy.aggregate([
            {
                $match: {
                userId: userId,
                type: 1,
                time: {$gte: dateFrom, $lte: dateTo},
            }
            },
            {
                $facet: {
                    counter: [{$count: "count"}],
                    list: [
                        { $sort: {id: -1} },
                        { $skip: skip },
                        { $limit: limit },
                    ]
                }
            }
        ])
        let list = [];
        let listTotal = 0;
        if (aggrData[0]&&aggrData[0].counter[0]) {
            list = aggrData[0].list;
            listTotal = aggrData[0].counter[0].count;
        }
        // //console.timeEnd("getPointSeenUv");
        return {total:total?total:0, list:list?list:[], listTotal:listTotal?listTotal:0}
        
    } catch (error) {
        console.log("getTotalPointSeenUv", error)
        return null;
    }
}

const getListNewShare = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getListNewShare");
        let aggrData = await SaveShareSocialNew.aggregate([
            {
                $match: {
                    userId,
                    userType: type,
                    newId: {$gt: 0}
                }
            },
            {
                $lookup : {
                    from : "NewTV365",
                    localField : "newId",
                    foreignField : "new_id",
                    as : "newTV365"
                }
            },
            {
                $unwind: "$newTV365"
            },
            {
                $facet: {
                    counter: [{$count: "count"}],
                    listTotal: [
                        {
                            $group: {
                                _id: {
                                    newId: "$newId",
                                    socialName: "$socialName"
                                },
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.newId"
                            }
                        },
                        {
                            $count: "count"
                        }
                    ],
                    list: [
                        {
                            $project: {
                                newId: "$newId",
                                time: "$time",
                                socialName: "$socialName",
                                new_id: "$newTV365.new_id",
                                new_title: "$newTV365.new_title",
                                new_alias: "$newTV365.new_alias",
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    newId: "$newId",
                                    socialName: "$socialName"
                                },
                                count: {$sum: 1},
                                time: {$max: "$time"},
                                new_id: {$first: "$new_id"},
                                new_title: {$first: "$new_title"},
                                new_alias: {$first: "$new_alias"},
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.newId",
                                shares: {$push: {
                                    socialName: "$_id.socialName",
                                    count: "$count"
                                }},
                                time: {$max: "$time"},
                                new_id: {$first: "$new_id"},
                                new_title: {$first: "$new_title"},
                                new_alias: {$first: "$new_alias"},
                            }
                        },
                        {
                            $sort: {time: -1}
                        },
                        {
                            $skip: skip
                        },
                        {
                            $limit: limit
                        },
                    ]
                }
            },
        ]);
        let list = [];
        let total = 0;
        let listTotal = 0;
        if (aggrData[0]&&aggrData[0].counter.length&&aggrData[0].listTotal.length) {
            total = aggrData[0].counter[0].count;
            listTotal = aggrData[0].listTotal[0].count;
            list = aggrData[0].list
        }
        //console.timeEnd("getListNewShare");
        list = reformatShareData(list);
        return {total:total?total:0, list:list?list:[], listTotal:listTotal?listTotal:0}
    } catch (error) {
        console.log("getListNewShare", error)
        return null;
    }
}

const getListUserShare = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getListUserShare");
        let aggrData = await SaveShareSocialUser.aggregate([
            {
                $match: {
                    userId,
                    userType: type,
                    userIdBeShare: {$gt: 0}
                }
            },
            {
                $lookup : {
                    from : "Users",
                    localField : "userIdBeShare",
                    foreignField : "idTimViec365",
                    as : "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $match: {
                    $expr: {$eq: ["$user.type", "$typeIdBeShare"]}
                }
            },
            {
                $facet: {
                    counter: [{$count: "count"}],
                    listTotal: [
                        {
                            $project: {
                                socialName: "$socialName",
                                use_id: "$user.idTimViec365",
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    use_id: "$use_id",
                                    socialName: "$socialName"
                                },
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.use_id",
                            }
                        },
                        {
                            $count: "count"
                        }
                    ],
                    list: [
                        {
                            $project: {
                                socialName: "$socialName",
                                time: "$time",
                                use_id: "$user.idTimViec365",
                                use_name: "$user.userName",
                                use_alias: "$user.alias",
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    use_id: "$use_id",
                                    socialName: "$socialName"
                                },
                                count: {$sum: 1},
                                use_id: {$first: "$use_id"},
                                use_name: {$first: "$use_name"},
                                use_alias: {$first:  "$use_alias"},
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.use_id",
                                shares: {$push: {
                                    socialName: "$_id.socialName",
                                    count: "$count"
                                }},
                                use_id: {$first: "$use_id"},
                                use_name: {$first: "$use_name"},
                                use_alias: {$first:  "$use_alias"},
                            }
                        },
                        {
                            $sort: {time: -1}
                        },
                        {
                            $skip: skip
                        },
                        {
                            $limit: limit
                        },
                    ]
                }
            }
        ]);
        let list = [];
        let total = 0;
        let listTotal = 0;
        if (aggrData[0]&&aggrData[0].counter.length&&aggrData[0].listTotal.length) {
            total = aggrData[0].counter[0].count;
            listTotal = aggrData[0].listTotal[0].count;
            list = aggrData[0].list
        }
        //console.timeEnd("getListUserShare");
        list = reformatShareData(list);
        return {total:total?total:0, list:list?list:[], listTotal:listTotal?listTotal:0};
    } catch (error) {
        console.log("getListUserShare", error)
        return null;
    }
}

const getListUrlShare = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getListUrlShare");
        let total = await SaveShareSocialNew.find({
            userId,
            userType: type,
            newId: 0
        }).count();
        let aggrData = await SaveShareSocialNew.aggregate([
            {
                $match: {
                    userId,
                    userType: type,
                    newId: 0
                }
            },
            {
                $project: {
                    newId: "$newId",
                    time: "$time",
                    socialName: "$socialName",
                    linkPage: "$linkPage"
                }
            },
            {
                $group: {
                    _id: {
                        linkPage: "$linkPage",
                        socialName: "$socialName"
                    },
                    count: {$sum: 1},
                    time: {$max: "$time"},
                    linkPage: {$first: "$linkPage"},

                }
            },
            {
                $group: {
                    _id: "$_id.linkPage",
                    shares: {$push: {
                        socialName: "$_id.socialName",
                        count: "$count"
                    }},
                    time: {$max: "$time"},
                    linkPage: {$first: "$linkPage"},
                }
            },
            {
                $facet: {
                    listTotal: [
                        {
                            $count: "count"
                        }
                    ],
                    list: [
                        {
                            $sort: {time: -1}
                        },
                        {
                            $skip: skip
                        },
                        {
                            $limit: limit
                        },
                    ]
                }
            }
        ]);
        let list = [];
        let listTotal = 0;
        if (aggrData[0]&&aggrData[0].listTotal.length) {
            listTotal = aggrData[0].listTotal[0].count;
            list = aggrData[0].list
        }
        //console.timeEnd("getListUrlShare");
        list = reformatShareData(list);
        return {total:total?total:0, list:list?list:[], listTotal:listTotal?listTotal:0}
    } catch (error) {
        console.log("getListUrlShare", error)
        return null;
    }
}

const getStarRating = async (userId, type) => {
    try {
        //console.time("getStarRating");
        let list = await SaveVote.aggregate([
            {
                $match: {
                    creater_be_vote: userId
                }
            },
            {
                $group: {
                    _id: "$id_be_vote",
                    star: {$sum: "$star"},
                    count: {$sum: 1}
                }
            }
        ]);
        let total = list.reduce((acc, val) => acc + (val.star), 0);
        let count = list.reduce((acc, val) => acc + (val.count), 0);
        let avg = total/count;
        //console.timeEnd("getStarRating");
        return {list:list?list:[], total, count, avg}
    } catch (error) {
        console.log("getStarRating", error)
        return null;
    }
}

const getListUvSeen = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getListUvSeen");
        let aggrData = await SaveSeeNewByEm.aggregate([
            {
                $match: {
                    hostId: userId
                }
            },
            {
                $lookup : {
                    from : "NewTV365",
                    localField : "newId",
                    foreignField : "new_id",
                    as : "new"
                }
            },
            {
                $unwind: "$new"
            },
            {
                $facet: {
                    counter: [{$count: "count"}],
                    totalCandidate: [
                        {
                            $group: {
                                _id: "$userId"
                            }
                        },
                        {$count: "count"}
                    ],
                    list: [{
                        $sort: {
                            id: -1
                        } 
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    },
                    {
                        $lookup : {
                            from : "Tv365SaveVote",
                            localField : "userId",
                            foreignField : "userId",
                            as : "star"
                        }
                    },
                    {
                        $project: {
                            userId: "$userId",
                            type: "$type",
                            name: "$name",
                            newId: "$newId",
                            hostId: "$hostId",
                            url: "$url",
                            start: "$start",
                            end: "$end",
                            duration: "$duration",
                            new_title: "$new.new_title",
                            new_alias: "$new.new_alias",
                            star: { $ifNull: [ { $arrayElemAt: [ "$star.star", 0 ] }, 0 ] }
                        }
                    }]
                }
            }
        ])
        let list = 0;
        let total = 0;
        let totalCandidate = 0;
        if (aggrData[0]&&aggrData[0].counter.length&&aggrData[0].totalCandidate.length) {
            list = aggrData[0].list;
            total = aggrData[0].counter[0].count;
            totalCandidate = aggrData[0].totalCandidate[0].count;
        }
        //console.timeEnd("getListUvSeen");
        return {list:list?list:[], total:total?total:0, totalCandidate:totalCandidate?totalCandidate:0};
    } catch (error) {
        console.log("getListNewSeen", error)
        return null;
    }
}

const getListCommentNew = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getListCommentNew");    
        let aggrData = await NewTV365.aggregate([
            {
                $match: {
                    new_user_id: userId
                }
            },
            {
                $lookup: {
                    from: "Tv365CommentPost",
                    localField :"new_id",
                    foreignField: "cm_new_id",
                    as: "comment"
                }
            },
            {
                $unwind: "$comment"
            },
            {
                $addFields: {cm_sender_idchat: "$comment.cm_sender_idchat"}
            },
            {
                $lookup: {
                    from: "Users",
                    localField: "cm_sender_idchat",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $facet: {
                    counter: [{$count: "count"}],
                    list: [
                    {
                        $sort: {"comment.cm_time": -1}
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    },
                    {
                        $project: {
                            cm_sender_idchat: "$cm_sender_idchat",
                            cm_sender_name: "$user.userName",
                            cm_time: "$comment.cm_time",
                            idNew: "$new_id",
                            cm_comment: "$comment.cm_comment",
                            cm_img: "$comment.cm_img",
                            new_title: 1,
                            new_alias: 1,
                            id_user: "$user.idTimViec365",
                            type_user: "$user.type",
                            alias_user: "$user.alias",
                        }
                    }]
                }
            }
        ]);
        let list = 0;
        let total = 0;
        if (aggrData[0]&&aggrData[0].counter[0]) {
            list = aggrData[0].list;
            total = aggrData[0].counter[0].count;
        }
        //console.timeEnd("getListCommentNew");
        return {list:list?list:[], total:total?total:0};
    } catch (error) {
        console.log("getListCommentNew", error)
        return null;
    }
}

const getListCommentNTD = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getListCommentNTD");
        let id_chat365 = (await Users.findOne({idTimViec365: userId, type: type}).select("_id").lean())._id;
        let aggrData = await CommentPost.aggregate([
            {
                $match: {
                    cm_sender_idchat: id_chat365
                }
            },
            {
                $lookup: {
                    from: "NewTV365",
                    localField :"cm_new_id",
                    foreignField: "new_id",
                    as: "new"
                }
            },
            {
                $unwind: "$new"
            },
            {
                $facet: {
                    counter: [{$count: "count"}],
                    list: [
                        {
                            $sort: {cm_time: -1}
                        },
                        {
                            $skip: skip
                        },
                        {
                            $limit: limit
                        },
                        {
                            $lookup : {
                                from : "Tv365SaveVote",
                                let: {cm_new_id: "$cm_new_id"},
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {$eq: ["$id_be_vote", "$$cm_new_id"]},
                                                    {$eq: ["$userId", userId]}
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as : "star"
                            }
                        },
                        {
                            $project: {
                                new_id: "$new.new_id",
                                cm_url: 1,
                                cm_comment: 1,
                                cm_time: 1,
                                cm_img: 1,
                                new_title: "$new.new_title",
                                new_alias: "$new.new_alias",
                                star: { $ifNull: [ { $arrayElemAt: [ "$star.star", 0 ] }, 0 ] }
                            }
                        }
                    ]
                }
            }
        ]);
        let list = 0;
        let total = 0;
        if (aggrData[0]&&aggrData[0].counter[0]) {
            list = aggrData[0].list;
            total = aggrData[0].counter[0].count;
        }
        //console.timeEnd("getListCommentNTD");
        return {list:list?list:[], total:total?total:0};
    } catch (error) {
        console.log("getListCommentNTD", error)
        return null;
    }
}

const getApplyData = async (userId, type) => {
    try {
        //console.time("getApplyData");
        let data = await NewTV365.aggregate([
            {
                $match: {
                    new_user_id: userId,
                    new_create_time: {$gt: 1687315166}
                }
            },
            {
                $lookup : {
                    from : "ApplyForJob",
                    localField : "new_id",
                    foreignField : "nhs_new_id",
                    as : "applied"
                }
            },
            {
                $unwind: {
                    path: "$applied",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    nhs_use_id: "$applied.nhs_use_id",
                    nhs_new_seen: "$applied.new_seen",
                }
            },
            {
                $facet: {
                    apply_all: [
                        {
                            $match: {
                                nhs_use_id: {$gt: 0}
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}
                            }
                        }
                    ],
                    apply_seen: [
                        {$match: {
                            nhs_use_id: {$gt: 0},
                            nhs_new_seen: 1
                        }},
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}
                            }
                        }
                    ],
                    apply_not_seen: [
                        {$match: {
                            nhs_use_id: {$gt: 0},
                            nhs_new_seen: {$ne: 1}
                        }},
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}
                            }
                        }
                    ],
                    new_not_apply: [
                        {
                            $match: {
                                "applied": null
                            }
                        },
                        {
                            $group: {
                                _id: "$new_id",
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}
                            }
                        }
                    ]
                }
            },
        ]);
        let countData = {
            apply_all: data[0].apply_all[0]?data[0].apply_all[0].count:0,
            apply_seen: data[0].apply_seen[0]?data[0].apply_seen[0].count:0,
            apply_not_seen: data[0].apply_not_seen[0]?data[0].apply_not_seen[0].count:0,
            new_not_apply: data[0].new_not_apply[0]?data[0].new_not_apply[0].count:0,
        }
        //console.timeEnd("getApplyData");
        return countData;
    } catch (error) {
        console.log("getApplyData", error)
        return null;
    }
}

const getAppliedList = async (userId, type, isSeen, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getAppliedList");
        dateFrom = dateFrom?Number(new Date(dateFrom).getTime()/1000):0;
        dateTo = (dateTo?Number(new Date(dateTo).getTime()/1000):Number(new Date().getTime()/1000)) + ONE_DAY_IN_SECONDS;
        let match = {
            nhs_time: {$gte: dateFrom, $lte: dateTo},
            nhs_use_id: {$ne: 0}
        }
        if (isSeen) {
            isSeen = Number(isSeen);
            if (isSeen === 1) {
                match['nhs_new_seen'] = 1;
            } else {
                match['nhs_new_seen'] = {$ne: 1};
            }
        }

        let aggrData = await NewTV365.aggregate([
            {
                $match: {
                    new_user_id: userId,
                    new_create_time: {$gt: 1687315166}
                }
            },
            {
                $lookup : {
                    from : "ApplyForJob",
                    localField : "new_id",
                    foreignField : "nhs_new_id",
                    as : "applied"
                }
            },
            {
                $unwind: "$applied"
            },
            {
                $addFields: {
                    nhs_time: "$applied.nhs_time",
                    nhs_use_id: "$applied.nhs_use_id",
                    nhs_new_seen: "$applied.new_seen"
                }
            },
            {
                $match: match
            },
            {
                $lookup : {
                    from : "Users",
                    let : {nhs_use_id: "$nhs_use_id"},
                    pipeline: [
                        {$match: {
                            $expr: {$eq: ["$$nhs_use_id", "$idTimViec365"]}
                        }},
                        {$limit: 1}
                    ],
                    as : "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $facet: {
                    listTotal: [{$count: "count"}],
                    list: [
                        {$sort: {nhs_time: -1}},
                        {$skip: skip},
                        {$limit: limit},
                        {
                            $project: {
                                nhs_id: "$applied.nhs_id",
                                nhs_time: "$applied.nhs_time",
                                nhs_thuungtuyen: "$applied.nhs_thuungtuyen",
                                nhs_new_id: "$applied.nhs_new_id",
                                nhs_use_id: "$applied.nhs_use_id",
                                use_id: "$user.idTimViec365",
                                use_first_name: "$user.userName",
                                new_id: 1,
                                new_title: 1,
                                new_alias: 1,
                            }
                        }
                    ]
                }
            }
        ]);
        let list = [];
        let listTotal = 0;
        if (aggrData[0]&&aggrData[0].listTotal.length) {
            listTotal = aggrData[0].listTotal[0].count;
            list = aggrData[0].list
        }
        //console.timeEnd("getAppliedList");
        return {list:list?list:[], listTotal:listTotal?listTotal:0}
    } catch (error) {
        console.log("getAppliedList", error)
        return null;
    }
}

const getOnsiteData = async (userId, type, skip = 0, limit = 5, dateFrom = null, dateTo = null) => {
    try {
        limit = Number(limit);
        skip = Number(skip);
        //console.time("getOnsiteData");
        //console.time("getOnsiteDataTotal")
        let total = await SaveNextPage.find({
            userType: type,
            userId: userId,
        }).count();
        //console.timeEnd("getOnsiteDataTotal")
        let list = await SaveNextPage.aggregate([
            {
                $match: {
                    userType: type,
                    userId: userId,
                }
            },
            {
                $sort: {startTime: -1}
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: "TV365HistoryLogin",
                    let: {
                        startTime: "$startTime",
                        endTime: "$endTime",
                    },
                    pipeline: [
                        {
                            $match: {
                                type: type,
                                userId: userId
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {$gte: ["$timeLogout", "$$startTime"]},
                                        {$lte: ["$timeLogin", "$$endTime"]}
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'session'
                }
            },
            {
                $unwind: "$session"
            },
            {
                $lookup: {
                    from: "TV365SaveNextPage",
                    let: {
                        timeLogin: "$session.timeLogin",
                        timeLogout: "$session.timeLogout",
                    },
                    pipeline: [
                        {
                            $match: {
                                userType: type,
                                userId: userId
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {$gte: ["$$timeLogout", "$startTime"]},
                                        {$lte: ["$$timeLogin", "$endTime"]}
                                    ]
                                }
                            }
                        },
                        {
                            $count: "count"
                        }
                    ],
                    as: "counter"
                }
            },
            {
                $group: {
                    _id: "$session.id",
                    timeLogin: {$first: "$session.timeLogin"},
                    timeLogout: {$first: "$session.timeLogout"},
                    count: {$first: "$counter.count"},
                    pages: {$push: {
                        startTime: "$startTime",
                        endTime: "$endTime",
                        link: "$link",
                    }}
                }
            },
            {
                $project: {
                    _id: 1,
                    timeLogin: 1,
                    timeLogout: 1,
                    pages: 1,
                    count: { $ifNull: [ { $arrayElemAt: [ "$count", 0 ] }, 0 ] },
                }
            },
            {$sort: {timeLogin: -1}}
        ])
        //console.timeEnd("getOnsiteData");
        return {total, list};
    } catch (error) {
        console.log("getNextPageData", error)
        return null;
    }
}

const getVipData = async (userId, type) => {
    try {
        //console.time("getVipData");
        let list = await SaveAccountVip.find({
            userId: userId,
            userType: type
        }).sort({id: -1});
        //console.timeEnd("getVipData");
        return list;
    } catch (error) {
        console.log("getVipData", error)
        return null;  
    }
}

const getHistoryPoint = async (userId, type) => {
    try {
        //console.time("getHistoryPoint");
        let historyPoint = await ManagerPointHistory.findOne({
            userId,
            type
        })
        //console.timeEnd("getHistoryPoint");
        return historyPoint;
    } catch (error) {
        console.log("getHistoryPoint", error)
        return null; 
    }
}

const getSaveExchangePoints = async (userId, type) => {
    try {
        let list = await SaveExchangePoint.find({
            userId: userId,
            userType: type
        })
        return list?list:[];
    } catch (error) {
        console.log("getSaveExchangePoints", error)
        return null; 
    }
}

exports.historyAll = async (req, res) => {
    try {
        let {
            userId,
            userType
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        console.log(userId, userType);
        let [
            historyPoint,
            saveExchangePoints,
            historyOnsite,
            candidateSeen,
            pointSeenUv,
            listNewShare,
            listUserShare,
            listUrlShare,
            starRating,
            listUvSeen,
            listCommentNew,
            listCommentNTD,
            applyData,
            onsiteData,
            vipData,
        ] = await Promise.all([
            getHistoryPoint(userId, userType),
            getSaveExchangePoints(userId, userType),
            getOnsiteHistory(userId, userType),
            getCandidateSeen(userId, userType),
            getPointSeenUv(userId, userType),
            getListNewShare(userId, userType),
            getListUserShare(userId, userType),
            getListUrlShare(userId, userType),
            getStarRating(userId, userType),
            getListUvSeen(userId, userType),
            getListCommentNew(userId, userType),
            getListCommentNTD(userId, userType),
            getApplyData(userId, userType),
            getOnsiteData(userId, userType),
            getVipData(userId, userType),
        ])

        let exchangedPoints = (await SaveExchangePoint.find({
            userId,
            userType
        })).reduce((acc, val) => acc+val.point, 0);
        return functions.success(res, "Thành công", {data: {
            historyPoint,
            exchangedPoints,
            saveExchangePoints,
            historyOnsite,
            candidateSeen,
            pointSeenUv,
            listNewShare,
            listUserShare,
            listUrlShare,
            starRating,
            listUvSeen,
            listCommentNew,
            listCommentNTD,
            applyData,
            onsiteData,
            vipData,
        }})
    } catch (error) {
        
        return functions.setError(res, "Đã có lỗi xảy ra", 500);
    }

}

exports.getOnsiteHistory = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getOnsiteHistory(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getCandidateSeen = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getCandidateSeen(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getPointSeenUv = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getPointSeenUv(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getListNewShare = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getListNewShare(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getListUrlShare = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getListUrlShare(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getListUserShare = async (req, res) => {
    try {
        let {   
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getListUserShare(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getListUvSeen = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getListUvSeen(userId, userType, skip, limit, dateFrom, dateTo);
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getListCommentNew = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getListCommentNew(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getListCommentNTD = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getListCommentNTD(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
exports.getOnsiteData = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getOnsiteData(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}

exports.getSaveExchangePoints = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getSaveExchangePoints(userId, userType, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}

exports.getAppliedList = async (req, res) => {
    try {
        let {
            page,
            limit,
            userId,
            userType,
            dateFrom,
            dateTo,
            isSeen
        } = req.body;
        if (!userId||!userType) return functions.setError(res, "Không đủ thông tin truyền lên", 400);
        userId = Number(userId);
        userType = Number(userType);
        if (!page) page = 1;
        if (!limit) limit = 5;
        let skip = (page - 1)*limit;
        let data = await getAppliedList(userId, userType, isSeen, skip, limit, dateFrom, dateTo)
        return functions.success(res, "Thành công", {data: data});
    } catch (error) {
        return functions.setError(res, "Đã xảy ra lỗi", 500);
    }
}
