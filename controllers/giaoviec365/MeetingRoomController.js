const functions = require('../../services/functions');
const Place = require('../../models/giaoviec365/qly_diaddiem');
const MeetingRoom = require('../../models/giaoviec365/qly_phonghop')
const user = require('../../models/Users')

class MeetingRoomController { 

    //[GET] /meeting-rooms/quan-ly-dia-diem
    async quanLyDiaDiem(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data.userName)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            let com_name
            const type = req.user.data.type
            if(type === 1) {
                com_id = req.user.data.idQLC
                com_name = req.user.data.userName
            }
            else if(type === 2) {
                com_id = req.user.data.com_id
                const com = await user.findOne({
                    type: 1,
                    idQLC: com_id
                }).lean()
                com_name = com.userName
            }
            const page = req.params.page
            const place = await Place.find({com_id}).skip(10*page - 10).limit(10).lean()
            const total = await Place.find({com_id}).count()
            return functions.success(res, 'Get place successfully', {listRole: req.listRole,data: {
                place,
                total,
                com_name,
            }})
        }catch(e){
            console.log(e)
            functions.setError(res, 'Failed to get place', 500)
        }
    }


    //[POST] /meeting-rooms/quan-ly-dia-diem/them-moi-dia-diem
    async themMoiDiaDiem(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data.userName)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.name || !req.body.dvsd|| !req.body.address)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                name,
                dvsd,
                address,
                updated_at,
            } = req.body
            const now = functions.getTimeNow();
            const placeMaxId = await Place.findOneWithDeleted({}, {}, { sort: { id: -1 } }).lean() || 0
            let maxId = placeMaxId.id
            if(!maxId) maxId = 0
            const id = Number(maxId) + 1
            let place = new Place({
                name,
                dvsd,
                address,
                updated_at,
                id,
                com_id,
                created_at: now,
            })
            await place.save()
            return functions.success(res,"Add success", {listRole: req.listRole,data:{
                place,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Add failure!!!", 501)
        }
    }

    // [PUT] /meeting-rooms/quan-ly-dia-diem/update/:id
    async suaDiaDiem(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            const type = req.user.data.type
            let com_id
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.name || !req.body.dvsd|| !req.body.address)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                name,
                dvsd,
                address,
            } = req.body
            const now = functions.getTimeNow()
            await Place.updateOne(
                {
                    id: req.params.id,
                },
                {
                    name,
                    dvsd,
                    address,
                    updated_at: now
                }
            )
            return functions.success(res, "Update successfully", { listRole: req.listRole,data: {
                newPlace: await Place.findOne({id: req.params.id}),
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Update failure!!!", 501)
        }
    }

    // [DELETE] /meeting-rooms/quan-ly-dia-diem/delete/:id
    async xoaDiaDiem(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const place = await Place.findOne(
                {
                    id:req.params.id,
                    com_id,
                }
                ).lean()
            if(!place) return functions.setError(req, 'Không tìm thấy địa điểm')
            const diadiem = place.id
            if (await MeetingRoom.findOne({diadiem}).count().lean() > 0){
                await MeetingRoom.delete({
                    diadiem
                })
            }
            await Place.delete({ 
                id:req.params.id,
                com_id,
            })
            return functions.success(res, "Delete successfully", { listRole: req.listRole,data: {

            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Delete failure!!!", 501)
        }
    }

    //[GET] /meeting-rooms/quan-ly-phong-hop
    async quanLyPhongHop(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const page = req.params.page
            const meetingRoom = await MeetingRoom.find({com_id}).skip(10*page - 10).limit(10).lean()
            meetingRoom.forEach(async (value) => {
                const id = value.diadiem
                const place = await Place.findOne({id}, {
                    _id: 0,
                    name: 1,
                })
                value.tenDiaDiem = place.name
            })
            const total = await MeetingRoom.find({com_id}).count()
            const listPlace = await Place.find({
                com_id,
            }).lean()
            return functions.success(res, 'Get meetingroom successfully', {listRole: req.listRole,data: {
                meetingRoom,
                total,
                listPlace,
            }})
        }catch(e){
            console.log(e)
            functions.setError(res, 'Failed to get meetingroom', 500)
        }
    }

    //[POST] /meeting-rooms/quan-ly-phong-hop/them-moi-phong-hop
    async themMoiPhongHop(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.name || !req.body.succhua|| !req.body.diadiem)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                name,
                succhua,
                diadiem,
            } = req.body
            const now = functions.getTimeNow()
            const meetingRoomMaxId = await MeetingRoom.findOneWithDeleted({}, {}, { sort: { id: -1 } }).lean() || 0
            let maxId = meetingRoomMaxId.id
            if (!maxId) maxId = 0
            const id = Number(maxId) + 1
            const meetingRoom = new MeetingRoom({
                name,
                succhua,
                trangthai: 2,
                id,
                diadiem,
                com_id,
                created_at: now,
            })
            await meetingRoom.save()
            return functions.success(res, 'Action successfully', {listRole: req.listRole,data: {
                meetingRoom,
            }})
        }catch(e){
            console.log(e)
            functions.setError(res, 'Action failure', 500)
        }
    }

    // [PUT] /meeting-rooms/quan-ly-phong-hop/update/:id
    async suaPhongHop(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.name || !req.body.succhua|| !req.body.diadiem)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                name,
                succhua,
                diadiem,
                trangthai,
            } = req.body
            const now = functions.getTimeNow()
            await MeetingRoom.updateOne(
                {
                    id: req.params.id,
                    com_id,
                },
                {
                    name,
                    succhua,
                    trangthai,
                    updated_at: now,
                    diadiem
                }
            )
            return functions.success(res, "Update successfully", { listRole: req.listRole,data: {

            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Update failure!!!", 501)
        }
    }

    // [DELETE] /meeting-rooms/quan-ly-phong-hop/delete/:id
    async xoaPhongHop(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            await MeetingRoom.delete({
                id:req.params.id ,
                com_id,
            })
            return functions.success(res, "Delete successfully", { listRole: req.listRole,data: {
                MeetingRoom: await MeetingRoom.findOne({ id:req.params.id })
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, "Delete failure!!!", 501)
        }
    }
}

module.exports = new MeetingRoomController()