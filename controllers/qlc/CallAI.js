const { default: axios } = require('axios')
const functions = require('../../services/functions')
const Users = require('../../models/Users')
const FormData = require('form-data')
const Jimp = require('jimp')

exports.DetectFace = async (req, res) => {
  const comp_id = req.body.company_id
  const image = req.body.image
  try {
    if (comp_id && image) {
      const resp = await axios.post(
        'http://43.239.223.19:6002/verify_web_company',
        // 'http://43.239.223.147:5001/verify_web_company',
        [
          {
            company_id: req.body.company_id,
            image: req.body.image,
          },
        ],
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      console.log(resp)
      if (resp.status === 200) {
        // return functions.success(res, 'Nhận diện thành công', {
        //   data: resp.data,
        // })
        return res.status(200).json({
          data: resp.data,
        })
      }
      return functions.setError(res, 'Nhận diện không thành công')
    } else {
      return functions.setError(res, 'Thiếu trường')
    }
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}

exports.DetectFace2 = async (req, res) => {
  const comp_id = req.body.company_id
  const image = req.body.image
  try {
    if (comp_id && image) {
      const resp = await axios.post(
        'http://43.239.223.19:6001/verify_web_company',
        [
          {
            company_id: req.body.company_id,
            image: req.body.image,
          },
        ],
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      res.status(200).send({
        data: resp.data,
      })
    } else {
      res.status(500).send({
        message: 'Thiếu trường',
      })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({
      error: error,
    })
  }
}

exports.UpdateFace = async (req, res) => {
  const company_id = req.body.company_id
  const user_id = req.body.user_id
  const isAndroid = req.body.isAndroid
  const image = req.body.image
  try {
    if (company_id && user_id && image) {
      // const listImg = listImgs?.split(',')
      const fd = new FormData()
      fd.append('company_id', company_id)
      fd.append('user_id', user_id)
      fd.append('isAndroid', isAndroid)
      fd.append('image', image)

      const data = await axios.post(
        // 'http://43.239.223.147:5001/v2/face_register_app',
        'http://43.239.223.19:6002/add_user_company',
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (data.data.data.result) {
        res.status(200).send({
          data: true,
          message: 'Cập nhật khuôn mặt thành công',
        })
      } else {
        res.status(500).json({
          data: {},
        })
      }
    } else {
      res.status(500).send({
        message: 'Thieu truong',
      })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({
      error: 'Có lỗi xảy ra bên AI',
    })
  }
}

// new base của Cường -AI
exports.UpdateFace2 = async (req, res) => {
  const company_id = req.body.company_id
  const user_id = req.body.user_id
  const isAndroid = req.body.isAndroid
  const image = req.body.image

  console.log(company_id, user_id)

  try {
    if (company_id && user_id && image) {
      // check tai khoan duoc cap nhat mat khong
      const user = await Users.aggregate([
        {
          $match: {
            'inForPerson.employee.com_id': Number(company_id),
            idQLC: Number(user_id),
            'inForPerson.employee.ep_status': 'Active',
            type: 2,
            authentic: 1,
          },
        },
        {
          $project: {
            idQLC: 1,
            allow: '$inForPerson.employee.allow_update_face',
          },
        },
      ])
      if (user[0].allow == 1) {
        const data = await axios.post(
          // 'http://43.239.223.147:5001/v2/face_register_app',
          'http://43.239.223.19:6002/add_user_company',
          [
            {
              company_id: company_id.toString(),
              user_id: user_id.toString(),
              images: JSON.parse(image),
            },
          ],
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        console.log(data)
        if (data.status) {
          console.log('UPDATE')
          await Users.findOneAndUpdate(
            {
              'inForPerson.employee.com_id': Number(company_id),
              idQLC: Number(user_id),
            },
            {
              $set: {
                'inForPerson.employee.allow_update_face': 0,
              },
            }
          )
          return functions.success(res, 'Lay Thanh cong', {})
        } else {
          return functions.setError(res, 'Khong tim thay user')
        }
      }
      return functions.setError(
        res,
        'Chưa được cấp quyền cập nhật khuôn mặt. Xin liên hệ với nhân sự để được cấp quyền'
      )
    }
    return functions.setError(res, 'Thieu truong')
  } catch (error) {
    console.log(error)
    return functions.setError(res, 'Có lỗi xảy ra')
  }
}

exports.detectFake = async (req, res) => {
  try {
    const image_url = req.body.image_url

    if (image_url) {
      const fd = new FormData()

      fd.append('image_url', image_url)
      const resp = await axios.post('http://43.239.223.19:4321/predict', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      if (resp.data) {
        return functions.success(res, 'Kiểm tra thành công', resp.data)
      } else {
        return functions.setError(res, 'Có lỗi bên AI', 500)
      }
    }

    return functions.setError(res, 'Thiếu trường ảnh truyền lên', 500)
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}
const fs = require('fs')
exports.saveImgCheckin = async (req, res) => {
  try {
    const idQLC = req.body.idQLC
    const time = req.body.time
    const comp_id = req.user.data.com_id

    if (idQLC && comp_id) {
      const img_url = req.body.img_url

      // parse from img_url to img file

      // Reads file in form buffer => <Buffer ff d8 ff db 00 43 00 ...
      const pathnameSplit = __dirname
        .split('/')
        .filter((item) => item !== '')
        .slice(0, -3)
      let pathname =
        '/' +
        pathnameSplit.join('/') +
        '/storage/base365/timviec365/time_keeping'

      // check folder exist if not create
      if (!fs.existsSync(pathname + '/' + comp_id)) {
        fs.mkdirSync(pathname + '/' + comp_id)
      }

      if (!fs.existsSync(pathname + '/' + comp_id + '/' + idQLC)) {
        fs.mkdirSync(pathname + '/' + comp_id + '/' + idQLC)
      }

      const date = new Date(time * 1000)
      const curDay = date.toLocaleDateString('en-US').replaceAll('/', '-')
      if (
        !fs.existsSync(pathname + '/' + comp_id + '/' + idQLC + '/' + curDay)
      ) {
        fs.mkdirSync(pathname + '/' + comp_id + '/' + idQLC + '/' + curDay)
      }

      // const buffer = fs.readFileSync("path-to-image.jpg");
      // // Pipes an image with "new-path.jpg" as the name.
      // fs.writeFileSync("new-path.jpg", buffer);

      // write to file
      const now = new Date(Date.now())
      const image = Buffer.from(img_url.split(',')[1], 'base64')
      fs.writeFileSync(
        pathname +
          '/' +
          comp_id +
          '/' +
          idQLC +
          '/' +
          curDay +
          '/' +
          time +
          '.png',
        image
      )

      return functions.success(res, 'Lưu lại thành công', {})
    }

    return functions.setError(res, 'Token không hợp lệ', 500)
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}

// convert text to speech using google tts API
const Gtts = require('gtts')
var path = require('path')
exports.textToSpeechGoogle = async (req, res) => {
  try {
    const text = req.body.text
    const user = req.user.data

    if (user) {
      if (text) {
        const tts = new Gtts(text, 'vi')

        const pathnameSplit = __dirname
          .split('/')
          .filter((item) => item !== '')
          .slice(0, -3)
        let pathname =
          '/' +
          pathnameSplit.join('/') +
          '/storage/base365/timviec365/audio/time_keeping'
        var filepath = path.join(pathname, '1.wav')
        tts.save(filepath, function (data) {})

        return functions.success(res, 'Chuyển đổi thành công', {
          link: 'https://api.timviec365.vn/timviec365/audio/time_keeping/1.wav',
        })
      }

      return functions.setError(res, 'Thiêu text truyền lên', 500)
    }

    return functions.setError(res, 'Thiếu Token', 500)
  } catch (err) {
    console.log(err)
    return functions.setError(res, err.message, 500)
  }
}

exports.DataThongKeGiaLap = async (req, res, next) => {
  try {
    const {
      key_truy_cap,
      thoi_gian_bat_dau,
      thiet_bi,
      thoi_gian_ket_thuc,
      hinh_thuc,
      trang,
      page_size,
    } = req.body
    const formDataCom = new FormData()
    if (key_truy_cap) formDataCom.append('key_truy_cap', key_truy_cap)
    if (thoi_gian_bat_dau)
      formDataCom.append('thoi_gian_bat_dau', thoi_gian_bat_dau)
    if (thoi_gian_ket_thuc)
      formDataCom.append('thoi_gian_ket_thuc', thoi_gian_ket_thuc)
    if (hinh_thuc) formDataCom.append('hinh_thuc', hinh_thuc)
    if (thiet_bi) formDataCom.append('thiet_bi', thiet_bi)
    if (trang) formDataCom.append('trang', trang)
    if (page_size) formDataCom.append('page_size', page_size)
    const data = await axios.post(
      'http://43.239.223.137:7040/api/qlc/admin/thong_ke_gia_lap',
      formDataCom
    )
    // console.log(data)
    return functions.success(res, 'Danh sách', {
      total: data.data.total,
      data: data.data.result,
    })
  } catch (e) {
    console.log(e)
    return functions.setError(res, e)
  }
}

exports.DiaChiMay = async (req, res, next) => {
  try {
    const { key_truy_cap, thoi_gian, thiet_bi } = req.body
    const formDataCom = new FormData()
    if (key_truy_cap) formDataCom.append('key_truy_cap', key_truy_cap)
    console.log(formDataCom)
    const data = await axios.post(
      'http://43.239.223.137:7044/api/qlc/admin/dia_chi_may',
      formDataCom
    )
    console.log(data.data.result)
    return functions.success(res, 'Danh sách', { data: data.data.result })
  } catch (e) {
    console.log(e)
    return functions.setError(res, e)
  }
}

// updateFace 3d
exports.UpdateFace3d = async (req, res) => {
  try {
    const type = req.user.data.type
    const idQLC = req.user.data.idQLC
    const com_id = req.user.data.com_id
    if (idQLC && type == 2) {
      const images = req.body
      // console.log(images)

      //call ai
      const resp = await axios.post(
        'http://43.239.223.11:1900/add_user_company',
        req.body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      console.log(resp)
      if (resp.status == 200) {
        //update face to 0
        await Users.findOneAndUpdate(
          {
            'inForPerson.employee.com_id': Number(com_id),
            idQLC: Number(idQLC),
          },
          {
            $set: {
              'inForPerson.employee.allow_update_face': 0,
            },
          }
        )
        return functions.success(res, 'Cập nhật khuôn mặt thành công')
      }
      return functions.setError(res, 'Lỗi cập nhật khuoon mặt')
    }

    return functions.setError(res, 'Sai Token')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}
