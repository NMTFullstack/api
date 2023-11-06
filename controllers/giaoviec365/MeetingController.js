const ExcelJS = require('exceljs')
const contentDisposition = require('content-disposition')
const fs = require('fs')

const Dep = require('../../models/qlc/Deparment')
const AttMeeting = require('../../models/giaoviec365/attachments_meeting')
const MeetingRoom = require('../../models/giaoviec365/qly_phonghop')
const MeetingEmailNoti = require('../../models/giaoviec365/meeting_email_noti')
const MeetingProtocol = require('../../models/giaoviec365/meeting_protocol')
const MeetingComment = require('../../models/giaoviec365/meeting_comments')
const MeetingRole = require('../../models/giaoviec365/meeting_role')
const Meeting = require('../../models/giaoviec365/meetings')
const User = require('../../models/Users')

const functions = require('../../services/functions')
const gv = require('../../services/giaoviec365/gvService')
const { resolve } = require('path')

class MeetingController {

    //[GET] /meetings/quan-ly-cuoc-hop
    async quanLyCuocHop(req, res, next){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            
            const listRole = req.listRole
            const arrRole = listRole.cuochop.split(',')
            const roleWatchMeeting = arrRole.pop()
            const now = functions.getTimeNow()
            const dayNow = functions.convertDateOtherType(now, true)
            const hourNow = functions.getHourNow()
            const keywords = req.query.keywords
            const TatCaCuocHop = {}
            const CuocHopSapDienRa = {}
            const CuocHopBiHuy = {}
            let CuocHopTaoBoiToi = {}

            if(roleWatchMeeting!=7){
                const user_id = req.user.data._id
                const stringId = user_id.toString()

                if (keywords){
                    // Tất cả cuộc họp
                    TatCaCuocHop.meetingToday = await gv.findByName(
                        -1,
                        Meeting,
                        'name_meeting',
                        keywords,
                        {
                            com_id,
                            date_start: {$eq: dayNow},
                            $text: {$search: stringId}
                        }
                    )
                    
                    TatCaCuocHop.meetingIsComing = await gv.findByName(
                        -1,
                        Meeting,
                        'name_meeting',
                        keywords,
                        {
                            com_id,
                            date_start: {$gte: dayNow},
                            time_start: {$gte: hourNow},
                            $text: {$search: stringId}
                        }
                    )
    
                    TatCaCuocHop.meetingDone = await gv.findByName(
                        -1,
                        Meeting,
                        'name_meeting',
                        keywords,
                        {
                            com_id,
                            $text: {$search: stringId},
                            $or: [
                                {
                                    date_start: {$lt: dayNow},
                                },
                                {
                                    date_start: {$eq: dayNow},
                                    time_start: {$lt: hourNow},
                                }
                            ]
                        }
                    )
    
                    // Cuộc họp sắp diễn ra
                    CuocHopSapDienRa.meetingToday = await gv.findByName(
                        -1,
                        Meeting,
                        'name_meeting',
                        keywords,
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 0,
                            date_start: {$eq: dayNow},
                            time_start: {$gt: hourNow},
                        }
                    )
                    CuocHopSapDienRa.meetingIsComing = await gv.findByName(
                        -1,
                        Meeting,
                        'name_meeting',
                        keywords,
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 0,
                            $or: [
                                {
                                    date_start: {$gt: dayNow},
                                },
                                {
                                    date_start: {$eq: dayNow},
                                    time_start: {$gt: hourNow},
                                }
                            ]
                        }
                    )
    
                    // Cuộc họp bị hủy
                    CuocHopBiHuy.meetingToday = await gv.findByName(
                        -1,
                        Meeting,
                        'name_meeting',
                        keywords,
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 1,
                            date_start: {$eq: dayNow},
                        }
                    )
                    CuocHopBiHuy.meetingIsComing = await gv.findByName(
                        -1,
                        Meeting,
                        'name_meeting',
                        keywords,
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 1,
                            $or: [
                                {
                                    date_start: {$gt: dayNow},
                                },
                                {
                                    date_start: {$eq: dayNow},
                                    time_start: {$gt: hourNow},
                                }
                            ]
                        }
                    )
                    CuocHopBiHuy.meetingDone = await gv.findByName(
                        -1,
                        Meeting,
                        'name_meeting',
                        keywords,
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 1,
                            $or: [
                                {
                                    date_start: {$lt: dayNow},
                                },
                                {
                                    date_start: {$eq: dayNow},
                                    time_start: {$lt: hourNow},
                                }
                            ]
                        }
                    )
                }else {
                    // Tất cả cuộc họp
                    TatCaCuocHop.meetingToday = await Meeting.find(
                        {
                            com_id,
                            $text: {$search: stringId},
                            date_start: {$eq: dayNow}
                        }
                    ).lean()
                    TatCaCuocHop.meetingIsComing = await Meeting.find({
                        com_id,
                        $text: {$search: stringId},
                        $or: [
                            {
                                date_start: {$eq: dayNow},
                                time_start: {$gt: hourNow},
                            },
                            {
                                date_start: {$gt: dayNow},
                            }
                        ]
                    }).lean()
                    TatCaCuocHop.meetingDone = await Meeting.find(
                        {
                            com_id,
                            $text: {$search: stringId},
                            $or: [
                                {
                                    date_start: {$lt: dayNow},
                                },
                                {
                                    $and: [
                                        {date_start: {$eq: dayNow}},
                                        {time_start: {$lt: hourNow}},
                                    ]
                                }
                            ]
                        }
                    ).lean()
    
                    // Cuộc họp sắp diễn ra
                    CuocHopSapDienRa.meetingToday = await Meeting.find(
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 0,
                            date_start: {$eq: dayNow},
                            time_start: {$gt: hourNow},
                        },
                    ).lean()
                    CuocHopSapDienRa.meetingIsComing = await Meeting.find(
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 0,
                            $or: [
                                {
                                    date_start: {$gt: dayNow},
                                },
                                {
                                    date_start: {$eq: dayNow},
                                    time_start: {$gt: hourNow},
                                }
                            ]
                        }
                    ).lean()
                    
                    // Cuộc họp bị hủy
                    CuocHopBiHuy.meetingToday = await Meeting.find(
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 1,
                            date_start: {$eq: dayNow},
                        }
                    ).lean()
                    CuocHopBiHuy.meetingIsComing = await Meeting.find(
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 1,
                            $or: [
                                {
                                    date_start: {$gt: dayNow},
                                },
                                {
                                    date_start: {$eq: dayNow},
                                    time_start: {$gt: hourNow},
                                }
                            ]
                        }
                    ).lean()
                    CuocHopBiHuy.meetingDone = await Meeting.find(
                        {
                            com_id,
                            $text: {$search: stringId},
                            is_cancel: 1,
                            $or: [
                                {
                                    date_start: {$lt: dayNow},
                                },
                                {
                                    $and: [
                                        {date_start: {$eq: dayNow}},
                                        {time_start: {$lt: hourNow}},
                                    ]
                                }
                            ]
                        }
                    ).lean()
                }
                CuocHopTaoBoiToi = TatCaCuocHop
    
                // Đếm số cuộc họp
                let countTatCaCuocHop = 0
                countTatCaCuocHop = TatCaCuocHop.meetingToday ? TatCaCuocHop.meetingToday.length + countTatCaCuocHop : countTatCaCuocHop
                countTatCaCuocHop = TatCaCuocHop.meetingIsComing ? TatCaCuocHop.meetingIsComing.length + countTatCaCuocHop : countTatCaCuocHop
                countTatCaCuocHop = TatCaCuocHop.meetingDone ? TatCaCuocHop.meetingDone.length + countTatCaCuocHop : countTatCaCuocHop
    
                let countCuocHopSapDienRa = 0
                countCuocHopSapDienRa = CuocHopSapDienRa.meetingToday ? CuocHopSapDienRa.meetingToday.length + countCuocHopSapDienRa : countCuocHopSapDienRa
                countCuocHopSapDienRa = CuocHopSapDienRa.meetingIsComing ? CuocHopSapDienRa.meetingIsComing.length + countCuocHopSapDienRa : countCuocHopSapDienRa
                countCuocHopSapDienRa = CuocHopSapDienRa.meetingDone ? CuocHopSapDienRa.meetingDone.length + countCuocHopSapDienRa : countCuocHopSapDienRa
    
                let countCuocHopBiHuy = 0
                countCuocHopBiHuy = CuocHopBiHuy.meetingToday ? CuocHopBiHuy.meetingToday.length + countCuocHopBiHuy : countCuocHopBiHuy
                countCuocHopBiHuy = CuocHopBiHuy.meetingIsComing ? CuocHopBiHuy.meetingIsComing.length + countCuocHopBiHuy : countCuocHopBiHuy
                countCuocHopBiHuy = CuocHopBiHuy.meetingDone ? CuocHopBiHuy.meetingDone.length + countCuocHopBiHuy : countCuocHopBiHuy
    
                let countCuocHopTaoBoiToi = 0
                countCuocHopTaoBoiToi = CuocHopTaoBoiToi.meetingToday ? CuocHopTaoBoiToi.meetingToday.length + countCuocHopTaoBoiToi : countCuocHopTaoBoiToi
                countCuocHopTaoBoiToi = CuocHopTaoBoiToi.meetingIsComing ? CuocHopTaoBoiToi.meetingIsComing.length + countCuocHopTaoBoiToi : countCuocHopTaoBoiToi
                countCuocHopTaoBoiToi = CuocHopTaoBoiToi.meetingDone ? CuocHopTaoBoiToi.meetingDone.length + countCuocHopTaoBoiToi : countCuocHopTaoBoiToi
                
                // Lấy ra tên các nhân viên và tên cuộc họp
                const promises = [
                    gv.takeStaffMeeting(TatCaCuocHop.meetingToday),
                    gv.takeStaffMeeting(TatCaCuocHop.meetingIsComing),
                    gv.takeStaffMeeting(TatCaCuocHop.meetingDone),
                    gv.takeStaffMeeting(CuocHopSapDienRa.meetingToday),
                    gv.takeStaffMeeting(CuocHopSapDienRa.meetingIsComing),
                    gv.takeStaffMeeting(CuocHopSapDienRa.meetingDone),
                    gv.takeStaffMeeting(CuocHopBiHuy.meetingToday),
                    gv.takeStaffMeeting(CuocHopBiHuy.meetingIsComin),
                    gv.takeStaffMeeting(CuocHopBiHuy.meetingDone),
                    gv.takeStaffMeeting(CuocHopTaoBoiToi.meetingToday),
                    gv.takeStaffMeeting(CuocHopTaoBoiToi.meetingIsComing),
                    gv.takeStaffMeeting(CuocHopTaoBoiToi.meetingDone),
    
                    gv.takeNameMeeting(TatCaCuocHop.meetingToday),
                    gv.takeNameMeeting(TatCaCuocHop.meetingIsComing),
                    gv.takeNameMeeting(TatCaCuocHop.meetingDone),
                    gv.takeNameMeeting(CuocHopSapDienRa.meetingToday),
                    gv.takeNameMeeting(CuocHopSapDienRa.meetingIsComing),
                    gv.takeNameMeeting(CuocHopSapDienRa.meetingDone),
                    gv.takeNameMeeting(CuocHopBiHuy.meetingToday),
                    gv.takeNameMeeting(CuocHopBiHuy.meetingIsComin),
                    gv.takeNameMeeting(CuocHopBiHuy.meetingDone),
                    gv.takeNameMeeting(CuocHopTaoBoiToi.meetingToday),
                    gv.takeNameMeeting(CuocHopTaoBoiToi.meetingIsComing),
                    gv.takeNameMeeting(CuocHopTaoBoiToi.meetingDone),
                ]
                const listEp = await User.find({
                    // com_id,
                    'inForPerson.employee.com_id': com_id,
                    type: 2,
                }, {
                    _id: 1,
                    userName: 1
                })
                const listMeetingRoom = await MeetingRoom.find({
                    com_id
                })

                return functions.success(res, 'Get meetings successfully', { listRole: req.listRole,data: {
                    TatCaCuocHop: {
                        TatCaCuocHop,
                        countTatCaCuocHop
                    },
                    CuocHopSapDienRa: {
                        CuocHopSapDienRa,
                        countCuocHopSapDienRa,
                    },
                    CuocHopBiHuy: {
                        CuocHopBiHuy,
                        countCuocHopBiHuy,
                    },
                    CuocHopTaoBoiToi: {
                        CuocHopTaoBoiToi,
                        countCuocHopTaoBoiToi,
                    },
                    listEp,
                    listMeetingRoom,
                }})
            }

            if (keywords){
                // Tất cả cuộc họp
                TatCaCuocHop.meetingToday = await gv.findByName(
                    -1,
                    Meeting,
                    'name_meeting',
                    keywords,
                    {
                        com_id,
                        date_start: {$eq: dayNow}
                    }
                )
                
                TatCaCuocHop.meetingIsComing = await gv.findByName(
                    -1,
                    Meeting,
                    'name_meeting',
                    keywords,
                    {
                        com_id,
                        date_start: {$gte: dayNow},
                        time_start: {$gte: hourNow},
                    }
                )

                TatCaCuocHop.meetingDone = await gv.findByName(
                    -1,
                    Meeting,
                    'name_meeting',
                    keywords,
                    {
                        com_id,
                        $or: [
                            {
                                date_start: {$lt: dayNow},
                            },
                            {
                                date_start: {$eq: dayNow},
                                time_start: {$lt: hourNow},
                            }
                        ]
                    }
                )

                // Cuộc họp sắp diễn ra
                CuocHopSapDienRa.meetingToday = await gv.findByName(
                    -1,
                    Meeting,
                    'name_meeting',
                    keywords,
                    {
                        com_id,
                        is_cancel: 0,
                        date_start: {$eq: dayNow},
                        time_start: {$gt: hourNow},
                    }
                )
                CuocHopSapDienRa.meetingIsComing = await gv.findByName(
                    -1,
                    Meeting,
                    'name_meeting',
                    keywords,
                    {
                        com_id,
                        is_cancel: 0,
                        $or: [
                            {
                                date_start: {$gt: dayNow},
                            },
                            {
                                date_start: {$eq: dayNow},
                                time_start: {$gt: hourNow},
                            }
                        ]
                    }
                )

                // Cuộc họp bị hủy
                CuocHopBiHuy.meetingToday = await gv.findByName(
                    -1,
                    Meeting,
                    'name_meeting',
                    keywords,
                    {
                        com_id,
                        is_cancel: 1,
                        date_start: {$eq: dayNow},
                    }
                )
                CuocHopBiHuy.meetingIsComing = await gv.findByName(
                    -1,
                    Meeting,
                    'name_meeting',
                    keywords,
                    {
                        com_id,
                        is_cancel: 1,
                        $or: [
                            {
                                date_start: {$gt: dayNow},
                            },
                            {
                                date_start: {$eq: dayNow},
                                time_start: {$gt: hourNow},
                            }
                        ]
                    }
                )
                CuocHopBiHuy.meetingDone = await gv.findByName(
                    -1,
                    Meeting,
                    'name_meeting',
                    keywords,
                    {
                        com_id,
                        is_cancel: 1,
                        $or: [
                            {
                                date_start: {$lt: dayNow},
                            },
                            {
                                date_start: {$eq: dayNow},
                                time_start: {$lt: hourNow},
                            }
                        ]
                    }
                )
            }else {
                // Tất cả cuộc họp
                TatCaCuocHop.meetingToday = await Meeting.find(
                    {
                        com_id,
                        date_start: {$eq: dayNow}
                    }
                ).lean()
                TatCaCuocHop.meetingIsComing = await Meeting.find({
                    com_id,
                    $or: [
                        {
                            date_start: {$eq: dayNow},
                            time_start: {$gt: hourNow},
                        },
                        {
                            date_start: {$gt: dayNow},
                        }
                    ]
                }).lean()
                TatCaCuocHop.meetingDone = await Meeting.find(
                    {
                        com_id,
                        $or: [
                            {
                                date_start: {$lt: dayNow},
                            },
                            {
                                $and: [
                                    {date_start: {$eq: dayNow}},
                                    {time_start: {$lt: hourNow}},
                                ]
                            }
                        ]
                    }
                ).lean()

                // Cuộc họp sắp diễn ra
                CuocHopSapDienRa.meetingToday = await Meeting.find(
                    {
                        com_id,
                        is_cancel: 0,
                        date_start: {$eq: dayNow},
                        time_start: {$gt: hourNow},
                    },
                ).lean()
                CuocHopSapDienRa.meetingIsComing = await Meeting.find(
                    {
                        com_id,
                        is_cancel: 0,
                        $or: [
                            {
                                date_start: {$gt: dayNow},
                            },
                            {
                                date_start: {$eq: dayNow},
                                time_start: {$gt: hourNow},
                            }
                        ]
                    }
                ).lean()
                
                // Cuộc họp bị hủy
                CuocHopBiHuy.meetingToday = await Meeting.find(
                    {
                        com_id,
                        is_cancel: 1,
                        date_start: {$eq: dayNow},
                    }
                ).lean()
                CuocHopBiHuy.meetingIsComing = await Meeting.find(
                    {
                        com_id,
                        is_cancel: 1,
                        $or: [
                            {
                                date_start: {$gt: dayNow},
                            },
                            {
                                date_start: {$eq: dayNow},
                                time_start: {$gt: hourNow},
                            }
                        ]
                    }
                ).lean()
                CuocHopBiHuy.meetingDone = await Meeting.find(
                    {
                        com_id,
                        is_cancel: 1,
                        $or: [
                            {
                                date_start: {$lt: dayNow},
                            },
                            {
                                $and: [
                                    {date_start: {$eq: dayNow}},
                                    {time_start: {$lt: hourNow}},
                                ]
                            }
                        ]
                    }
                ).lean()
            }
            CuocHopTaoBoiToi = TatCaCuocHop

            // Đếm số cuộc họp
            let countTatCaCuocHop = 0
            countTatCaCuocHop = TatCaCuocHop.meetingToday ? TatCaCuocHop.meetingToday.length + countTatCaCuocHop : countTatCaCuocHop
            countTatCaCuocHop = TatCaCuocHop.meetingIsComing ? TatCaCuocHop.meetingIsComing.length + countTatCaCuocHop : countTatCaCuocHop
            countTatCaCuocHop = TatCaCuocHop.meetingDone ? TatCaCuocHop.meetingDone.length + countTatCaCuocHop : countTatCaCuocHop

            let countCuocHopSapDienRa = 0
            countCuocHopSapDienRa = CuocHopSapDienRa.meetingToday ? CuocHopSapDienRa.meetingToday.length + countCuocHopSapDienRa : countCuocHopSapDienRa
            countCuocHopSapDienRa = CuocHopSapDienRa.meetingIsComing ? CuocHopSapDienRa.meetingIsComing.length + countCuocHopSapDienRa : countCuocHopSapDienRa
            countCuocHopSapDienRa = CuocHopSapDienRa.meetingDone ? CuocHopSapDienRa.meetingDone.length + countCuocHopSapDienRa : countCuocHopSapDienRa

            let countCuocHopBiHuy = 0
            countCuocHopBiHuy = CuocHopBiHuy.meetingToday ? CuocHopBiHuy.meetingToday.length + countCuocHopBiHuy : countCuocHopBiHuy
            countCuocHopBiHuy = CuocHopBiHuy.meetingIsComing ? CuocHopBiHuy.meetingIsComing.length + countCuocHopBiHuy : countCuocHopBiHuy
            countCuocHopBiHuy = CuocHopBiHuy.meetingDone ? CuocHopBiHuy.meetingDone.length + countCuocHopBiHuy : countCuocHopBiHuy

            let countCuocHopTaoBoiToi = 0
            countCuocHopTaoBoiToi = CuocHopTaoBoiToi.meetingToday ? CuocHopTaoBoiToi.meetingToday.length + countCuocHopTaoBoiToi : countCuocHopTaoBoiToi
            countCuocHopTaoBoiToi = CuocHopTaoBoiToi.meetingIsComing ? CuocHopTaoBoiToi.meetingIsComing.length + countCuocHopTaoBoiToi : countCuocHopTaoBoiToi
            countCuocHopTaoBoiToi = CuocHopTaoBoiToi.meetingDone ? CuocHopTaoBoiToi.meetingDone.length + countCuocHopTaoBoiToi : countCuocHopTaoBoiToi
            
            // Lấy ra tên các nhân viên và tên cuộc họp
            const promises = [
                gv.takeStaffMeeting(TatCaCuocHop.meetingToday),
                gv.takeStaffMeeting(TatCaCuocHop.meetingIsComing),
                gv.takeStaffMeeting(TatCaCuocHop.meetingDone),
                gv.takeStaffMeeting(CuocHopSapDienRa.meetingToday),
                gv.takeStaffMeeting(CuocHopSapDienRa.meetingIsComing),
                gv.takeStaffMeeting(CuocHopSapDienRa.meetingDone),
                gv.takeStaffMeeting(CuocHopBiHuy.meetingToday),
                gv.takeStaffMeeting(CuocHopBiHuy.meetingIsComin),
                gv.takeStaffMeeting(CuocHopBiHuy.meetingDone),
                gv.takeStaffMeeting(CuocHopTaoBoiToi.meetingToday),
                gv.takeStaffMeeting(CuocHopTaoBoiToi.meetingIsComing),
                gv.takeStaffMeeting(CuocHopTaoBoiToi.meetingDone),

                gv.takeNameMeeting(TatCaCuocHop.meetingToday),
                gv.takeNameMeeting(TatCaCuocHop.meetingIsComing),
                gv.takeNameMeeting(TatCaCuocHop.meetingDone),
                gv.takeNameMeeting(CuocHopSapDienRa.meetingToday),
                gv.takeNameMeeting(CuocHopSapDienRa.meetingIsComing),
                gv.takeNameMeeting(CuocHopSapDienRa.meetingDone),
                gv.takeNameMeeting(CuocHopBiHuy.meetingToday),
                gv.takeNameMeeting(CuocHopBiHuy.meetingIsComin),
                gv.takeNameMeeting(CuocHopBiHuy.meetingDone),
                gv.takeNameMeeting(CuocHopTaoBoiToi.meetingToday),
                gv.takeNameMeeting(CuocHopTaoBoiToi.meetingIsComing),
                gv.takeNameMeeting(CuocHopTaoBoiToi.meetingDone),
            ]

            await Promise.all(promises)
            
            const listEp = await User.find({
                // com_id,
                'inForPerson.employee.com_id': com_id,
                type: 2,
            }, {
                _id: 1,
                userName: 1
            })
            const listMeetingRoom = await MeetingRoom.find({
                com_id
            })
            return functions.success(res, 'Get meetings successfully', { listRole: req.listRole,data: {
                TatCaCuocHop: {
                    TatCaCuocHop,
                    countTatCaCuocHop
                },
                CuocHopSapDienRa: {
                    CuocHopSapDienRa,
                    countCuocHopSapDienRa,
                },
                CuocHopBiHuy: {
                    CuocHopBiHuy,
                    countCuocHopBiHuy,
                },
                CuocHopTaoBoiToi: {
                    CuocHopTaoBoiToi,
                    countCuocHopTaoBoiToi,
                },
                listEp,
                listMeetingRoom,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to get the meetings', 500)
        }
    }

    // /meetings/chi-tiet-cuoc-hop/:id/huy-cuoc-hop
    async huyCuocHop(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id = req.params.id
            await Meeting.updateOne({id, com_id}, {
                is_cancel: 1,
            })

            return functions.success(res, 'Action success')
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed')
        }
    }

    //[POST] /meetings/quan-ly-cuoc-hop/them-cuoc-hop-truc-tiep
    async themCuocHopTrucTiep(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if(!req.body.name_meeting || !req.body.date_start || !req.body.time_start || !req.body.time_estimated || !req.body.staff_owner || !req.body.staff_take_in || !req.body.address_links){
                return functions.setError(res, 'Vui lòng điền đầy đủ thông tin', 400)
            }
            const now = functions.getTimeNow();
            const id = await functions.getMaxIdByFieldWithDeleted(Meeting,'id')
            const {
                name_meeting,
                content,
                date_start,
                time_start,
                time_estimated,
                department_id,
                staff_owner,
                staff_ecretary,
                staff_preparation,
                staff_take_in,
                address_links,
                is_send_mail,
            } = req.body
            if(gv.checkDue(date_start, time_start,'<'))
                return functions.setError(res, 'Thời gian bắt đầu không hợp lệ', 400)
            const meeting = new Meeting({
                id,
                com_id,
                name_meeting,
                content,
                date_start,
                time_start,
                time_estimated,
                department_id,
                staff_owner,
                staff_ecretary,
                staff_preparation,
                staff_take_in,
                address_links,
                is_send_mail,
                type: 1,
                created_at: now,
            })
            await meeting.save()
            return functions.success(res, 'Add meeting successfully', { listRole: req.listRole,data: {
                meeting,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Add meeting failure', 500)
        }
    }

    //[POST] /meetings/quan-ly-cuoc-hop/them-cuoc-hop-truc-tuyen
    async themCuocHopTrucTuyen(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if(!req.body.name_meeting || !req.body.date_start || !req.body.time_start || !req.body.time_estimated || !req.body.staff_owner || !req.body.staff_take_in || !req.body.address_links){
                return functions.setError(res, 'Vui lòng điền đầy đủ thông tin', 400)
            }
            const now = functions.getTimeNow();
            const id = await functions.getMaxIdByFieldWithDeleted(Meeting,'id')
            const {
                name_meeting,
                content,
                date_start,
                time_start,
                time_estimated,
                department_id,
                staff_owner,
                staff_ecretary,
                staff_preparation,
                staff_take_in,
                address_links,
                is_send_mail,
            } = req.body
            if(gv.checkDue(date_start, time_start,'<'))
                return functions.setError(res, 'Thời gian bắt đầu không hợp lệ', 400)
            const meeting = new Meeting({
                id,
                com_id,
                name_meeting,
                content,
                date_start,
                time_start,
                time_estimated,
                department_id,
                staff_owner,
                staff_ecretary,
                staff_preparation,
                staff_take_in,
                address_links,
                is_send_mail,
                type: 2,
                created_at: now,
            })
            await meeting.save()
            return functions.success(res, 'Add meeting successfully', { listRole: req.listRole,data: {
                meeting,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Add meeting failure', 500)
        }
    }
    
    //[GET] /meetings/chi-tiet-cuoc-hop/:id
    async chiTietCuocHop(req, res, next){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id = Number(req.params.id)
            const checkMeeting = await Meeting.findOne({id})
            if(!checkMeeting) return functions.setError(res, 'Do not found meeting')
            const typeMeeting = checkMeeting.type
            let meeting1
            if(typeMeeting == 1){
                const address_links = Number(checkMeeting.address_links)
                meeting1 = Meeting.aggregate([
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {$eq: ['$id', id]},
                                    {$eq: ['$com_id', com_id]}
                                ]
                            }
                        }
                    },
                    {
                        $addFields: {
                            user_id: { 
                                $map: {
                                    input: { $split: ["$staff_owner", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }},
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $addFields: {
                            user_id: { 
                                $map: {
                                    input: { $split: ["$staff_ecretary", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "ecretary"
                        }
                    },
                    {
                        $addFields: {
                            user_id: { 
                                $map: {
                                    input: { $split: ["$staff_preparation", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "preparation"
                        }
                    },
                    {
                        $addFields: {
                            user_id: { 
                                $map: {
                                    input: { $split: ["$staff_take_in", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "take_in"
                        }
                    },   
                    {
                        $addFields: {
                            dep_id: { 
                                $map: {
                                    input: { $split: ["$department_id", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "QLC_Deparments",
                            localField: "dep_id",
                            foreignField: "dep_id",
                            as: "dep"
                        }
                    },             
                    {
                        $lookup: {
                            from: 'gv365qlyphonghops',
                            pipeline: [{$match: {$expr: {$eq: ['$id', address_links]}}}],
                            as: 'room'
                        }
                    },
                    {$unwind: '$room'},
                    {
                        $project: {
                            "id": "$id",
                            "com_id": "$com_id",
                            "name_meeting": "$name_meeting",
                            "content": "$content",
                            "date_start": "$date_start",
                            "time_start": "$time_start",
                            "time_estimated": "$time_estimated",
                            "department": '$dep',
                            "staff_owner": "$staff_owner",
                            "name_owner": "$owner.userName",
                            "id_owner": "$owner._id",
                            "staff_ecretary": "$staff_ecretary",
                            "name_ecretary": "$ecretary.userName",
                            "id_ecretary": "$ecretary._id",
                            "staff_preparation": "$staff_preparation",
                            "name_preparation": "$preparation.userName",
                            "id_preparation": "$preparation._id",
                            "staff_take_in": "$staff_take_in",
                            "name_take_in": "$take_in.userName",
                            "id_take_in": "$take_in._id",
                            "address_links": "$address_links",
                            'name_room': '$room.name',
                            "is_send_mail": "$is_send_mail",
                            "type": "$type",
                            "is_delete": "$is_delete",
                            "is_cancel": "$is_cancel",
                            "deleted_at": "$deleted_at",
                            "date_deleted_at": "$date_deleted_at",
                            "created_at": "$created_at",
                        }
                    }
                ])
            }
            if(typeMeeting == 2){
                meeting1 = Meeting.aggregate([
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {$eq: ['$id', id]},
                                    {$eq: ['$com_id', com_id]}
                                ]
                            }
                        }
                    },
                    {
                        $addFields: {
                            user_id: { 
                                $map: {
                                    input: { $split: ["$staff_owner", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $addFields: {
                            user_id: { 
                                $map: {
                                    input: { $split: ["$staff_ecretary", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "ecretary"
                        }
                    },
                    {
                        $addFields: {
                            user_id: { 
                                $map: {
                                    input: { $split: ["$staff_preparation", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "preparation"
                        }
                    },
                    {
                        $addFields: {
                            user_id: { 
                                $map: {
                                    input: { $split: ["$staff_take_in", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "take_in"
                        }
                    },
                    {
                        $addFields: {
                            dep_id: { 
                                $map: {
                                    input: { $split: ["$department_id", ","] },
                                    in: { 
                                        $cond: {
                                            if: { $ne: ["$$this", ""] },
                                            then: { $toInt: "$$this" },
                                            else: null
                                          }
                                    }
                            }}
                        }
                    },
                    {
                        $lookup: {
                            from: "QLC_Deparments",
                            localField: "dep_id",
                            foreignField: "dep_id",
                            as: "dep"
                        }
                    },    
                    {$unwind: '$dep'},
                    {
                        $project: {
                            "id": "$id",
                            "com_id": "$com_id",
                            "name_meeting": "$name_meeting",
                            "content": "$content",
                            "date_start": "$date_start",
                            "time_start": "$time_start",
                            "time_estimated": "$time_estimated",
                            "department_id": "$department_id",
                            'department': '$dep',
                            "staff_owner": "$staff_owner",
                            "name_owner": "$owner.userName",
                            "id_owner": "$owner._id",
                            "staff_ecretary": "$staff_ecretary",
                            "name_ecretary": "$ecretary.userName",
                            "id_ecretary": "$ecretary._id",
                            "staff_preparation": "$staff_preparation",
                            "name_preparation": "$preparation.userName",
                            "id_preparation": "$preparation._id",
                            "staff_take_in": "$staff_take_in",
                            "name_take_in": "$take_in.userName",
                            "id_take_in": "$take_in._id",
                            "address_links": "$address_links",
                            "is_send_mail": "$is_send_mail",
                            "type": "$type",
                            "is_delete": "$is_delete",
                            "is_cancel": "$is_cancel",
                            "deleted_at": "$deleted_at",
                            "date_deleted_at": "$date_deleted_at",
                            "created_at": "$created_at",
                        }
                    }
                ])
            }
            
            const attMeeting1 =  AttMeeting.find({meeting_id: id}).lean()
            const meetingProtocol1 =  MeetingProtocol.find({meeting_id: id}).lean()
            const meetingComment1 =  MeetingComment.aggregate([
                {
                    $match: {meeting_id: id}
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: {user_id: {$toInt: '$staff_id'}},
                        pipeline: [
                            {
                                $match: {$expr: {$eq: ['$_id', '$$user_id']}}
                            }
                        ],
                        as: 'user',
                    }
                },
                {$unwind: '$user'},
                {
                    $project: {
                        'id': '$id',
                        'meeting_id': '$meeting_id',
                        'staff_id': '$staff_id',
                        'staff_name': '$user.userName',
                        'content': '$content',
                        'deleted_at': '$deleted_at',
                        'created_at': '$created_at',
                        'updated_at': '$updated_at',
                    }
                }
            ])
            const meetingRole1 =  MeetingRole.find({com_id})
            const listEp1 =  User.find({'inForPerson.employee.com_id': com_id,
            type: 2,},'userName').lean()
            const listDep1 =  Dep.find({com_id}).lean()
            const [
                meeting,
                attMeeting,
                meetingProtocol,
                meetingComment,
                meetingRole,
                listEp,
                listDep,
            ] = await Promise.all([
                meeting1,
                attMeeting1,
                meetingProtocol1,
                meetingComment1,
                meetingRole1,
                listEp1,
                listDep1,
            ])
            let meetingDetails = {
                ...meeting[0],
                meetingComment,
                meetingProtocol,
                attMeeting,
            }
            if(!meeting[0]) meetingDetails = {}
            return functions.success(res, 'Action successful', { listRole: req.listRole,data: {
                meetingDetails,
                listEp,
                listDep,
                meetingRole,
            }})
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failure', 500)
        }
    }

    //[PUT] /meetings/chi-tiet-cuoc-hop/:id/edit
    async suaCuocHop(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if(!req.body.name_meeting || !req.body.date_start || !req.body.time_start || !req.body.time_estimated || !req.body.staff_owner || !req.body.staff_take_in || !req.body.address_links){
                return functions.setError(res, 'Vui lòng điền đầy đủ thông tin', 400)
            }
            const id = req.params.id
            const now = functions.getTimeNow();
            const {
                name_meeting,
                content,
                date_start,
                time_start,
                time_estimated,
                department_id,
                staff_owner,
                staff_ecretary,
                staff_preparation,
                staff_take_in,
                address_links,
                is_send_mail,
            } = req.body
            if(gv.checkDue(date_start, time_start,'<'))
                return functions.setError(res, 'Thời gian bắt đầu không hợp lệ', 400)
            const listEp = await User.find({
                'inForPerson.employee.com_id': com_id,
                // com_id,
                type: 2,
            }, {
                _id: 1,
                userName: 1
            })
            await Meeting.updateOne({id, com_id},{
                name_meeting,
                content,
                date_start,
                time_start,
                time_estimated,
                department_id,
                staff_owner,
                staff_ecretary,
                staff_preparation,
                staff_take_in,
                address_links,
                is_send_mail,
                updated_at: now,
            })
            return functions.success(res, 'Action successfully', {listRole: req.listRole,data: {
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failure', 500)
        }
    }

    //[PUT] /meetings/chi-tiet-cuoc-hop/role
    async quanLyPhanQuyen(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            await MeetingRole.deleteMany({com_id})
            const id = await functions.getMaxIdByField(MeetingRole, 'id')
            const id2 = id + 1
            const managementMeetingRole = new MeetingRole({
                id,
                role_id: 1,
                com_id,
                permission_meet_id: req.body.checked_management,
            })
            const employeeMeetingRole = new MeetingRole({
                id: id2,
                role_id: 2,
                com_id,
                permission_meet_id: req.body.checked_ep,
            })
            await managementMeetingRole.save()
            await employeeMeetingRole.save()
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                managementMeetingRole,
                employeeMeetingRole,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [GET] /meetings/chi-tiet-cuoc-hop/:id/export-excel
    async xuatExcel(req, res, next){
        try{
            const id = req.params.id
            const meeting = await Meeting.findOne(
                {
                    id,
                }, 
                {
                    _id: 0,
                    id: 1,
                    name_meeting : 1,
                    content : 1,
                    date_start : 1,
                    time_start : 1,
                    time_estimated : 1,
                    department_id: 1,
                    address_links : 1,
                    staff_owner : 1,
                    staff_ecretary: 1,
                }
            )
            const timeStart = meeting.time_start + ' ' + meeting.date_start
            let staff_owner = await User.findOne({_id: meeting.staff_owner}, 'userName')
            let staff_ecretary = await User.findOne({_id: meeting.staff_ecretary}, 'userName')
            if(staff_owner) staff_owner = staff_owner.userName
            if(staff_ecretary) staff_ecretary = staff_ecretary.userName
            if(!meeting.content) meeting.content = null
            const meeting_xlsx = {
                STT: 1,
                ['Tên cuộc họp']: meeting.name_meeting,
                ['Nội dung cuộc họp']: meeting.content,
                ['Thời gian bắt đầu']: timeStart,
                ['Thời lượng']: meeting.time_estimated,
                ['Địa điểm']: meeting.address_links,
                ['Bộ phận tham gia']: meeting.department_id,
                ['Chủ trì cuộc họp']: staff_owner,
                ['Thư ký cuộc họp']: staff_ecretary,  
            }

            // Tạo excel
            const wb = new ExcelJS.Workbook()
            const ws = await wb.addWorksheet('My sheet')
            ws.columns = [
                {key: 'STT', header: 'STT'},
                {key: ['Tên cuộc họp'], header: 'Tên cuộc họp'},
                {key: ['Nội dung cuộc họp'], header: 'Nội dung cuộc họp'},
                {key: ['Thời gian bắt đầu'], header: 'Thời gian bắt đầu'},
                {key: ['Thời lượng'], header: 'Thời lượng'},
                {key: ['Địa điểm'], header: 'Địa điểm'},
                {key: ['Bộ phận tham gia'], header: 'Bộ phận tham gia'},
                {key: ['Chủ trì cuộc họp'], header: 'Chủ trì cuộc họp'},
                {key: ['Thư ký cuộc họp'], header: 'Thư ký cuộc họp'},
            ]
            ws.addRow(meeting_xlsx).commit()

            res.setHeader(
                "Content-Type",  
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );   
            res.setHeader(
                "Content-Disposition",
                contentDisposition(`${meeting.name_meeting}.xlsx`)
            );
            await wb.xlsx.write(res)
            return res.end()
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [PUT] /meetings/chi-tiet-cuoc-hop/cai-dat-tin-nhan-thong-bao
    async caiDatEmailNoti(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            await MeetingEmailNoti.deleteMany({com_id})
            const id = await functions.getMaxIdByField(MeetingRole, 'id')
            const meetingEmailNoti = new MeetingEmailNoti({
                id,
                com_id,
                email_noti_id: req.body.email_noti_id,
            })
            await meetingEmailNoti.save()
            return functions.success(res, 'Action successfully', {listRole: req.listRole,})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [DELETE] /meetings/chi-tiet-cuoc-hop/:id/delete
    async xoaCuocHop(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const dayNow = functions.convertDateOtherType(now, true)
            const date = functions.convertTimestamp(dayNow)
            const id = req.params.id
            await Meeting.updateOneWithDeleted({id, com_id}, {
                deleted_at: now,
                date_deleted_at: date,
                is_delete: 1,
            })
            await Meeting.delete({id, com_id })
            return functions.success(res, 'Action successfully', {listRole: req.listRole,})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [POST] meetings/chi-tiet-cuoc-hop/:id/add-comment
    async themBinhLuan(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const staff_id = req.user.data._id
            if(!req.body.content) 
                return functions.setError(res, 'Bình luận không hợp lệ', 400)
            const content = req.body.content
            const meeting_id = req.params.id
            const now = functions.getTimeNow()
            const id = await functions.getMaxIdByFieldWithDeleted(MeetingComment, 'id')
            const comment = new MeetingComment({
                id,
                meeting_id,
                staff_id,
                content,
                created_at: now
            })
            await comment.save()
            return functions.success(res, 'Action successfully', {listRole: req.listRole,data:{
                comment,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [DELETE] /meetings/chi-tiet-cuoc-hop/:id/delete-comment/:commentId
    async xoaBinhLuan(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const meeting_id = req.params.id
            const id = req.params.commentId
            await MeetingComment.updateOneWithDeleted({id}, {
                deleted_at: now,
            })
            await MeetingComment.delete({id})
            return functions.success(res, 'Action successfully', {listRole: req.listRole,})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [POST] meetings/chi-tiet-cuoc-hop/:id/add-protocol
    async themBienBanHop(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const staff_id = req.user.data._id
            if(req.files.length){
                const now = functions.getTimeNow()
                const id = await functions.getMaxIdByField(MeetingProtocol, 'id')
                const meeting_id = req.params.id
                const filesNum = req.files.length
                for (let i = 0; i < filesNum; i++){
                    let meetingProtocol = new MeetingProtocol({
                        id: id + i,
                        meeting_id,
                        created_at: now,
                        name_file: req.files[i].filename,
                        size_file: req.files[i].size,
                        staff_id,
                    })
                    await meetingProtocol.save()
                }
            }else return functions.setError(res, "Invalid files")
            return functions.success(res, "Add successfully", {listRole: req.listRole,data: {
                File: req.files
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, "Add failure!!!", 501)
        }
    }

    // [DELETE] /meetings/chi-tiet-cuoc-hop/:id/delete-protocol/:protocolId
    async xoaBienBanHop(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const staff_id = req.user.data._id
            const meeting_id = req.params.id
            const id = req.params.protocolId
            const protocol = await MeetingProtocol.findOne({id, meeting_id}, {_id: 0, name_file: 1})
            console.log(protocol)
            if(!protocol) return functions.setError(res, 'Không tìm thấy file', 404)
            else {
                try{
                    const path = `../storage/base365/giaoviec365/Meeting/${protocol.name_file}`
                    await fs.unlinkSync(path)
                }catch(e){
                    console.log(e)
                    return functions.setError(res, 'Không tìm thấy file', 404)
                }
            }
            await MeetingProtocol.deleteOne({id})
            return functions.success(res, 'Action successfully', {listRole: req.listRole,})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [GET] /meetings/chi-tiet-cuoc-hop/:id/download-protocol/:protocolId
    async taiBienBanHop (req, res, next){
        try{
            const meeting_id = req.params.id
            const id = req.params.protocolId
            const file = await MeetingProtocol.findOne({id, meeting_id}, {_id: 0, name_file: 1})
            if(!file) return functions.setError(res, 'Không tìm thấy file', 404)
            else{
                const nameFile = file.name_file
                return res.download(`../storage/base365/giaoviec365/Meeting/${nameFile}`)
            }
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [POST] meetings/chi-tiet-cuoc-hop/:id/add-attachments
    async themTapTinDinhKem(req, res){
        try{
            if(!req.user || !req.user.data || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            const staff_id = req.user.data._id
            if(req.files.length){
                const now = functions.getTimeNow()
                const id = await functions.getMaxIdByField(AttMeeting, 'id')
                const meeting_id = req.params.id
                const filesNum = req.files.length
                for (let i = 0; i < filesNum; i++){
                    let attMeeting = new AttMeeting({
                        id: id + i,
                        meeting_id,
                        created_at: now,
                        name_file: req.files[i].filename,
                        size_file: req.files[i].size,
                        staff_id,
                    })
                    await attMeeting.save()
                }
            }else return functions.setError(res, "Invalid files")
            return functions.success(res, "Add successfully", {listRole: req.listRole,data: {
                File: req.files
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, "Add failure!!!", 501)
        }
    }

    // [DELETE] /meetings/chi-tiet-cuoc-hop/:id/delete-attachments/:attId
    async xoaTapTinDinhKem(req, res){
        try{
            if(!req.user || !req.user.data || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            const staff_id = req.user.data._id
            const meeting_id = req.params.id
            const id = req.params.attId
            const attMeeting = await AttMeeting.findOne({id, meeting_id}, {_id: 0, name_file: 1})
            if(!attMeeting) return functions.setError(res, 'Không tìm thấy file', 404)
            else {
                const path = `../storage/base365/giaoviec365/Meeting/${attMeeting.name_file}`
                try{
                    await fs.unlinkSync(path)
                }catch(e){
                    console.log(e)
                    return functions.setError(res, 'Không tìm thấy file', 404)
                }
            }
            await AttMeeting.deleteOne({id})
            return functions.success(res, 'Action successfully', {listRole: req.listRole,})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // [GET] meetings/chi-tiet-cuoc-hop/:id/download-attachments/:attId
    async taiTapTinDinhKem (req, res, next){
        try{
            const meeting_id = req.params.id
            const id = req.params.attId
            const file = await AttMeeting.findOne({id, meeting_id}, {_id: 0, name_file: 1})
            if(!file) return functions.setError(res, 'Không tìm thấy file', 404)
            else{
                const nameFile = file.name_file
                return res.download(`../storage/base365/giaoviec365/Meeting/${nameFile}`)
            }
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!!',501)
        }
    }

    // meetings/chi-tiet-cuoc-hop/:id/sua-thanh-vien-cuoc-hop
    async chinhSuaThanhVienCuocHop(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const staff_owner = req.body.staff_owner
            const staff_ecretary = req.body.staff_ecretary
            const staff_preparation = req.body.staff_preparationion
            const staff_take_in = req.body.staff_take_in
            const id = req.params.id
            let data = {}
            if(staff_owner !== undefined) data = {staff_owner}
            if(staff_ecretary !== undefined) data = {staff_ecretary}
            if(staff_preparation !== undefined) data = {staff_preparation}
            if(staff_take_in !== undefined) data = {staff_take_in}
            await Meeting.updateOne({
                com_id,
                id,
            },{
                ...data,
                updated_at: now,
            })
            return functions.success(res, 'Action successfully')
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    
    
}

module.exports = new MeetingController()

