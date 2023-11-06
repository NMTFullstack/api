const JobFile = require('../../models/giaoviec365/job_files');
const MyJobFileProject = require('../../models/giaoviec365/myjob_file_project')
const MyJobFileProcess = require('../../models/giaoviec365/myjob_file_process')
const User = require('../../models/Users')
const FileComment = require('../../models/giaoviec365/file_comments')
const TblFileTongQuan = require('../../models/giaoviec365/tbl_file_tongquan')
const functions = require('../../services/functions');
const gv = require('../../services/giaoviec365/gvService')
const fs = require('fs')
const path = require('path')

class FileController {

    //[GET] /files/quan-ly-tai-lieu-cong-viec
    async quanLyTaiLieuCongViec(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const page = req.params.page
            const skip = page ? Number(page) * 10 - 10 : 0
            const keywords = req.query.keywords ? req.query.keywords : ''
            const file = TblFileTongQuan.aggregate([{
                    $match: {
                        com_id,
                        name_file: { $regex: keywords, $options: 'i' }
                    }
                },
                {
                    $sort: { 'created_at': -1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: 10
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'created_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: "$user" },
                {
                    $project: {
                        _id: 0,
                        "id": "$id",
                        "name_file": "$name_file",
                        "size_file": "$size_file",
                        "com_id": "$com_id",
                        "created_at": "$created_at",
                        "is_delete": "$is_delete",
                        "created_by": "$created_by",
                        "created_id": "$created_id",
                        "created_name": "$user.userName",
                        "deleted_at": "$deleted_at",
                        "type_project": "$type_project",
                        "meber_duan": "$meber_duan",
                    }
                },

            ])

            const user = User.find({
                // com_id,
                'inForPerson.employee.com_id': com_id,
                type: 2,
            }, {
                userName: 1,
                _id: 1,
            })
            const [
                files,
                listEp,
            ] = await Promise.all([
                file,
                user,
            ])

            return functions.success(res, 'Get Job Files successfully', {
                listRole: req.listRole,
                data: {
                    files,
                    listEp,
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Failed to get Job Files')
        }
    }

    //[POST] /files/quan-ly-tai-lieu-cong-viec/them-tai-lieu
    async taiLenTaiLieu(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const created_by = type
            const created_id = req.user.data._id
            if (req.files.length) {
                const now = functions.getTimeNow()
                const id = await functions.getMaxIdByFieldWithDeleted(TblFileTongQuan, 'id')
                const filesNum = req.files.length
                for (let i = 0; i < filesNum; i++) {
                    const tblFileTongQuan = new TblFileTongQuan({
                        id: id + i,
                        created_at: now,
                        name_file: req.files[i].filename,
                        com_id,
                        created_by,
                        created_id,
                        size_file: req.files[i].size,
                    })
                    await tblFileTongQuan.save()
                }
            } else return functions.setError(res, "Invalid files", 503)

            return functions.success(res, "Add successfully", {
                listRole: req.listRole,
                data: {
                    File: req.files
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Add failure!!!", 501)
        }
    }

    //[GET] /files/quan-ly-tai-lieu-cong-viec/tai-xuong-tai-lieu/:id
    async taiXuongTaiLieu(req, res, next) {
        try {
            // if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
            //     return functions.setError(res, 'Failed to get user data', 401)
            // let com_id
            // const type = req.user.data.type
            // if(type === 1) com_id = req.user.data.idQLC
            // if(type === 2) com_id = req.user.data.com_id
            const id = req.params.id
            const file = await TblFileTongQuan.findOne({ id }, { _id: 0, name_file: 1, type_project: 1 })
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)
            else {
                const nameFile = file.name_file
                const currentPath = path.resolve(__dirname, '../../../')
                if (file.type_project === null) {
                    const filePath = path.join(currentPath, 'storage/base365/giaoviec365/Job', nameFile)
                    res.download(filePath, (err) => {
                        if (err) return functions.setError(res, 'Không tìm thấy file')
                    })
                }
                if (file.type_project === 1) {
                    const filePath = path.join(currentPath, 'storage/base365/giaoviec365/Project', nameFile)
                    res.download(filePath, (err) => {
                        if (err) return functions.setError(res, 'Không tìm thấy file')
                    })
                }
                if (file.type_project === 2) {
                    const filePath = path.join(currentPath, 'storage/base365/giaoviec365/Process', nameFile)
                    res.download(filePath, (err) => {
                        if (err) return functions.setError(res, 'Không tìm thấy file')
                    })
                }

            }
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failed!!!', 501)
        }
    }

    //[DELELTE] /files/quan-ly-tai-lieu-cong-viec/xoa-tai-lieu/:id
    async xoaTaiLieu(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const id = req.params.id
            const now = functions.getTimeNow()
            const file = await TblFileTongQuan.findOne({ id, com_id }, { _id: 0, name_file: 1, type_project: 1 })
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)
                // if(file.type_project === 1){
                //     await MyJobFileProject.updateOne({id}, {
                //         is_delete: 1,
                //         deleted: true,
                //     })
                // }
                // if(file.type_project === 2){
                //     await MyJobFileProcess.updateOne({id}, {
                //         is_delete: 1,
                //         deleted: true,
                //     })
                // }
            await TblFileTongQuan.updateOne({ id, com_id }, {
                is_delete: 1,
                deleted: true,
                deleted_at: now,
            })
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[GET] /files/quan-ly-tai-lieu-cua-toi
    async quanLyTaiLieuCuaToi(req, res, next) {
            try {
                if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                    return functions.setError(res, 'Failed to get user data', 401)
                let com_id
                const type = req.user.data.type
                if (type === 1) com_id = req.user.data.idQLC
                if (type === 2) com_id = req.user.data.com_id
                const created_id = req.user.data._id
                const keywords = req.query.keywords ? req.query.keywords : ''
                const page = req.params.page
                const skip = page ? Number(page) * 10 - 10 : 0
                const file = TblFileTongQuan.aggregate([{
                        $match: {
                            com_id,
                            name_file: { $regex: keywords, $options: 'i' },
                            created_id,
                        }
                    },
                    {
                        $sort: { 'created_at': -1 }
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: 10
                    },
                    {
                        $lookup: {
                            from: 'Users',
                            localField: 'created_id',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    { $unwind: "$user" },
                    {
                        $project: {
                            _id: 0,
                            "id": "$id",
                            "name_file": "$name_file",
                            "size_file": "$size_file",
                            "com_id": "$com_id",
                            "created_at": "$created_at",
                            "is_delete": "$is_delete",
                            "created_by": "$created_by",
                            "created_id": "$created_id",
                            "created_name": "$user.userName",
                            "deleted_at": "$deleted_at",
                            "type_project": "$type_project",
                            "meber_duan": "$meber_duan",
                        }
                    },
                ])

                const user = User.find({
                    // com_id,
                    'inForPerson.employee.com_id': com_id,
                    type: 2,
                }, {
                    userName: 1,
                    _id: 1,
                })
                const [
                    files,
                    listEp,
                ] = await Promise.all([
                    file,
                    user,
                ])
                return functions.success(res, 'Get Job Files successfully', {
                    listRole: req.listRole,
                    data: {
                        files,
                        listEp,
                    }
                })
            } catch (e) {
                console.log(e)
                return functions.setError(res, 'Failed to get Job Files')
            }
        }
        //[POST] /files/quan-ly-tai-lieu-cua-toi/them-tai-lieu
    async taiLenTaiLieuCuaToi(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const created_by = type
            const created_id = req.user.data._id
            if (req.files.length) {
                const now = functions.getTimeNow()
                const id = await functions.getMaxIdByFieldWithDeleted(TblFileTongQuan, 'id')
                const filesNum = req.files.length
                for (let i = 0; i < filesNum; i++) {
                    const tblFileTongQuan = new TblFileTongQuan({
                        id: id + i,
                        created_at: now,
                        name_file: req.files[i].filename,
                        com_id,
                        created_by,
                        created_id,
                        size_file: req.files[i].size,
                    })
                    await tblFileTongQuan.save()
                }
            } else return functions.setError(res, "Invalid files", 503)

            return functions.success(res, "Add successfully", {
                listRole: req.listRole,
                data: {
                    File: req.files
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Add failure!!!", 501)
        }
    }

    //[GET] /files/quan-ly-tai-lieu-cua-toi/tai-xuong-tai-lieu/:id
    async taiXuongTaiLieuCuaToi(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const id = req.params.id
            const created_id = req.user.data._id
            const file = await TblFileTongQuan.findOne({ id, com_id, created_id }, { _id: 0, name_file: 1, type_project: 1 })
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)
            else {
                const nameFile = file.name_file
                if (file.type_project === null)
                    res.download(`../storage/base365/giaoviec365/Job/${nameFile}`)
                if (file.type_project === 1)
                    res.download(`../storage/base365/giaoviec365/Project/${nameFile}`)
                if (file.type_project === 2)
                    res.download(`../storage/base365/giaoviec365/Process/${nameFile}`)

            }
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failed!!!', 501)
        }
    }

    //[DELELTE] /files/quan-ly-tai-lieu-cua-toi/xoa-tai-lieu/:id
    async xoaTaiLieuCuaToi(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const id = req.params.id
            const created_id = req.user.data._id
            const now = functions.getTimeNow()
            const file = await TblFileTongQuan.findOne({ id, com_id, created_id }, { _id: 0, name_file: 1, type_project: 1 })
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)
                // if(file.type_project === 1){
                //     await MyJobFileProject.updateOne({id, upload_by: created_id}, {
                //         is_delete: 1,
                //         deleted: true,
                //     })
                // }
                // if(file.type_project === 2){
                //     await MyJobFileProcess.updateOne({id, upload_by: created_id}, {
                //         is_delete: 1,
                //         deleted: true,
                //     })
                // }
            await TblFileTongQuan.updateOne({ id, com_id, created_id }, {
                is_delete: 1,
                deleted: true,
                deleted_at: now,
            })
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }


    //[GET] /files/chi-tiet-tai-lieu/:id
    async chiTietTaiLieu(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            if (!req.params.id) return functions.setError(res, 'Thiếu dữ liệu truyền lên')
            const id = Number(req.params.id)
            const fileData = TblFileTongQuan.findOne({ id, com_id })
            const fileCommentData = FileComment.aggregate([{
                    $match: { id_files: id }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'staff_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 0,
                        'id': '$id',
                        'id_files': '$id_files',
                        'staff_id': '$staff_id',
                        'staff_name': '$user.userName',
                        'content': '$conent',
                        'created_at': '$created_at',
                        'updated_at': '$updated_at',
                    }
                }
            ])
            const [
                file,
                fileComment
            ] = await Promise.all([fileData, fileCommentData])
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    file,
                    fileComment,
                }
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[POST] /files/chi-tiet-tai-lieu/:id/add-comment
    async themFileComment(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const id = req.params.id
            if (!req.body.content)
                return functions.setError(res, 'Bình luận không được để trống')
            const content = req.body.content
            const idComment = await functions.getMaxIdByFieldWithDeleted(FileComment, 'id')
            const now = functions.getTimeNow()
            const fileComment = new FileComment({
                id: idComment,
                id_files: id,
                staff_id: user_id,
                conent: content,
                created_at: now,
            })
            await fileComment.save()
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    fileComment,
                }
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[POST] /files/chi-tiet-tai-lieu/:id/edit-comment/:commentId
    async suaFileComment(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const file_id = req.params.id
            const id = req.params.commentId
            if (!req.body.content)
                return functions.setError(res, 'Bình luận không được để trống')
            const content = req.body.content
            const now = functions.getTimeNow()
            await FileComment.updateOne({ id, id_files: file_id }, {
                conent: content,
                updated_at: now,
            })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[POST] /files/chi-tiet-tai-lieu/:id/edit-comment/:commentId
    async xoaFileComment(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const file_id = req.params.id
            const id = req.params.commentId
            const now = functions.getTimeNow()
            await FileComment.updateOne({ id, id_files: file_id }, {
                deleted_at: now,
                deleted: true,
            })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[GET] /files/chi-tiet-tai-lieu-cua-toi/:id
    async chiTietTaiLieuCuaToi(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const created_id = req.user.data._id
            if (!req.params.id) return functions.setError(res, 'Thiếu dữ liệu truyền lên')
            const id = Number(req.params.id)
            const fileData = TblFileTongQuan.findOne({ id, com_id, created_id })
            const fileCommentData = FileComment.aggregate([{
                    $match: { id_files: id }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'staff_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 0,
                        'id': '$id',
                        'id_files': '$id_files',
                        'staff_id': '$staff_id',
                        'staff_name': '$user.userName',
                        'content': '$conent',
                        'created_at': '$created_at',
                        'updated_at': '$updated_at',
                    }
                }
            ])
            const [
                file,
                fileComment
            ] = await Promise.all([fileData, fileCommentData])
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)

            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    file,
                    fileComment,
                }
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[POST] /files/chi-tiet-tai-lieu/:id/add-comment
    async themFileCommentCuaToi(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const id = req.params.id
            if (!req.body.content)
                return functions.setError(res, 'Bình luận không được để trống')
            const content = req.body.content
            const idComment = await functions.getMaxIdByFieldWithDeleted(FileComment, 'id')
            const now = functions.getTimeNow()
            const fileComment = new FileComment({
                id: idComment,
                id_files: id,
                staff_id: user_id,
                conent: content,
                created_at: now,
            })
            await fileComment.save()
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    fileComment,
                }
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[POST] /files/chi-tiet-tai-lieu/:id/edit-comment/:commentId
    async suaFileCommentCuaToi(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const file_id = req.params.id
            const id = req.params.commentId
            if (!req.body.content)
                return functions.setError(res, 'Bình luận không được để trống')
            const content = req.body.content
            const now = functions.getTimeNow()
            await FileComment.updateOne({ id, id_files: file_id, staff_id: user_id }, {
                conent: content,
                updated_at: now,
            })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[POST] /files/chi-tiet-tai-lieu/:id/edit-comment/:commentId
    async xoaFileCommentCuaToi(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const file_id = req.params.id
            const id = req.params.commentId
            const now = functions.getTimeNow()
            await FileComment.updateOne({ id, id_files: file_id, staff_id: user_id }, {
                deleted_at: now,
                deleted: true,
            })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }
}

module.exports = new FileController()