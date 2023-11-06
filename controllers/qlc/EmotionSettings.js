const functions = require("../../services/functions")
const fnc = require("../../services/qlc/functions")
const EmotionSettings = require("../../models/qlc/EmotionSettings")
const Users = require('../../models/Users')

exports.getEmotionSettings = async(req, res) => {
    try {
        const score = Number(req.body.score) || 0
        const com_id = req.user.data.com_id
        const type = req.user.data.type
        if (type == 1) {
            let condition = { com_id: com_id }
            if (score) {
                condition = {
                    ...condition,
                    min_score: { $lte: score },
                    max_score: { $gte: score },

                }
            }

            const list = await EmotionSettings.aggregate([
                { $match: condition },
                { $sort: { emotion_id: 1 } },
                { $project: { emotion_id: '$emotion_id', emotion_detail: '$emotion_detail', min_score: '$min_score', max_score: '$max_score', com_id: '$com_id', avg_pass_score: '$avg_pass_score' } },
            ])
            return functions.success(res, 'Thanh cong', {
                list: list
            })
        }
        return functions.setError(res, 'Tai khoan khong phai tai khoan cong ty')

    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

exports.createNewEmotion = async(req, res) => {
    try {

        let com_id = req.user.data.com_id;
        // const emotion_id = req.body.emotion_id
        const emotion_detail = req.body.emotion_detail
        const min_score = req.body.min_score
        const max_score = req.body.max_score
        const avg_pass_score = 0

        let maxID = await EmotionSettings.findOne({}, {}, { sort: { emotion_id: -1 } }).lean() || 0;
        const newEmo = new EmotionSettings({
            emotion_id: Number(maxID.emotion_id + 1) || 1,
            emotion_detail: emotion_detail,
            min_score: min_score,
            max_score: max_score,
            avg_pass_score: avg_pass_score,
            com_id: com_id
        })
        await newEmo.save()

        return functions.success(res, 'Them moi thanh cong', {})
    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

exports.updateNewEmotion = async(req, res) => {
    try {

        const type = req.user.data.type

        if (type == 1) {
            const { emotion_id, emotion_detail, min_score, max_score } = req.body;

            if (emotion_id) {
                await EmotionSettings.findOneAndUpdate({ emotion_id: emotion_id }, {
                    emotion_detail: emotion_detail,
                    min_score: min_score,
                    max_score: max_score
                })

                return functions.success(res, 'Cập nhật thành công', {})
            }

            return functions.setError(res, 'Thiếu ID truyền lên', 500)
        }

        return functions.setError(res, 'Tài khoản không phải tài khoản công ty', 500)


    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

exports.deleteEmotion = async(req, res) => {
    try {

        const type = req.user.data.type

        if (type == 1) {
            const { emotion_id } = req.body;

            if (emotion_id) {
                await EmotionSettings.findOneAndDelete({ emotion_id: emotion_id })

                return functions.success(res, 'Xóa thành công', 200)

            }

            return functions.setError(res, 'Thiếu ID truyền lên', 500)
        }

        return functions.setError(res, 'Tài khoản không phải tài khoản công ty', 500)


    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

exports.updateMinScore = async(req, res) => {
    try {

        const type = req.user.data.type
        const com_id = req.user.data.com_id

        if (type == 1) {
            const { avg_score } = req.body;

            await EmotionSettings.updateMany({ com_id: com_id }, {
                $set: {
                    avg_pass_score: avg_score
                }
            })

            return functions.success(res, 'Cập nhật giới hạn điểm thành công', 200)
        }

        return functions.setError(res, 'Tài khoản không phải tài khoản công ty', 500)


    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

exports.toggleOnOffEmotion = async(req, res) => {
    try {
        const type = req.user.data.type
        const com_id = req.user.data.idQLC

        if (type === 1) {
            const curState = await Users.aggregate([{

                    $match: {
                        idQLC: com_id,
                        type: 1
                    }
                },
                {
                    $limit: 1
                },
                {
                    $project: {
                        emotion_active: 1
                    }
                }
            ])



            if (curState.length > 0) {
                const state = curState[0].emotion_active

                const result = await Users.updateOne({
                    idQLC: com_id,
                    type: 1
                }, {
                    $set: {
                        emotion_active: !state
                    }
                })

                if (result.modifiedCount > 0) {
                    return functions.success(res, 'Cập nhật thành công', {
                        emotion_setting: !state
                    })
                }

                return functions.setError(res, 'Cập nhật lỗi')

            }
            return functions.setError(res, 'Không tìm thấy tài khoản')
        }
        return functions.setError(res, 'Tài khoản không phải tài khoản công ty')
    } catch (err) {
        console.log(err)
        return functions.setError(res, error.message)
    }
}

exports.getInfoToggleEmotion = async(req, res) => {
    try {

        const type = req.user.data.type
        if (type === 1) {
            const com_id = req.user.data.idQLC


            const emotionData = await Users.aggregate([{
                    $match: {
                        idQLC: com_id,
                        type: 1
                    }
                },
                {
                    $limit: 1
                },
                {
                    $project: {
                        'emotion_active': 1
                    }
                }
            ])

            if (emotionData.length > 0) {
                return functions.success(res, 'Lấy thành công', { data: emotionData[0] })
            }
            return functions.setError(res, 'Tài khoản không tồn tại')
        }

        return functions.setError(res, 'Tài khoản không phải tài khoản công ty')

    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}