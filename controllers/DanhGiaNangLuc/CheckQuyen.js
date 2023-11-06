

const functions = require('../../services/functions')
const PhanQuyen = require('../../models/DanhGiaNangLuc/TblPhanQuyen')


exports.CheckQuyen = async (req, res, next) => {
    try {
        const type = req.user.data.type
        
        const result = {
            tieuchi_dg: 0,
            de_kiemtra: 0,
            ketqua_dg: 1,
            kehoach_dg:0,
            lotrinh_thangtien: 1,
            phieu_dg: 1,
            phanquyen: 0,
            thangdiem: 0
        }
        if (type === 1) {
                result.tieuchi_dg = 1
                result.de_kiemtra = 1
                result.kehoach_dg=1
                result.phanquyen = 1
                result.thangdiem =1
        }
        else {
            const filter ={}
            filter.id_user = req.user.data._id
            filter.id_cty = req.user.data.com_id


            const option = {
                tieuchi_dg: 1,
                de_kiemtra: 1,
                kehoach_dg: 1,
                phanquyen: 1,
                thangdiem:1
        
            }

            const arrayPQ = await PhanQuyen.findOne(filter, option)
            if (arrayPQ) {
                if (arrayPQ.tieuchi_dg) result.tieuchi_dg = 1
                if (arrayPQ.de_kiemtra) result.de_kiemtra = 1
                if (arrayPQ.kehoach_dg) result.kehoach_dg = 1
                if (arrayPQ.phanquyen) result.phanquyen = 1
                if (arrayPQ.thangdiem) result.thangdiem = 1
            }
        }
        return functions.success(res, 'Successfully', { data: result })

    }
    catch (error) {
        return functions.setError(res, 'Internal Server', 500)
    }
}
/// Api phan quyen chuc nang xem va them ccho muc cai dat
exports.CaiDat = async (req, res, next) => {
    try {
        const type = req.user.data.type
        const result = { view : 0, add : 0 }
        if (type === 2) {
            const id_user = req.user.data._id
            const id_cty = req.user.data.com_id

            const filter = {}
            if (id_user) filter.id_user = id_user
            if (id_cty) filter.id_cty = id_cty

            const objectCheck = await PhanQuyen.findOne(filter, { thangdiem: 1 })
            if(objectCheck){
                const arrayCheck = objectCheck.thangdiem.split(',')
                for (let index = 0; index < arrayCheck.length; index++) {
                    const element = arrayCheck[index];
                    if (element === '1') result.view = 1
                    if (element === '2') result.add = 1
                }
            }
           
        }
        else { 
            result.view =1
            result.add =1 
        }
        return functions.success(res, 'Successfully', { data: result }) 
    }
    catch (error) {
        return functions.setError(res, 'Internal Server', 500)
    }
}
// phan quyen chuc nang cho muc de danh gia

exports.DeDG = async(req,res,next) =>{
    try {
        const type = req.user.data.type
        const result = { view : 0, add : 0, change: 0, delete:0 }
        if (type === 2) {
            const id_user = req.user.data._id
            const id_cty = req.user.data.com_id

            const filter = {}
            if (id_user) filter.id_user = id_user
            if (id_cty) filter.id_cty = id_cty

            const objectCheck = await PhanQuyen.findOne(filter, { tieuchi_dg: 1 })
            if(objectCheck){

                const arrayCheck = objectCheck.tieuchi_dg.split(',')
                for (let index = 0; index < arrayCheck.length; index++) {
                    const element = arrayCheck[index];
                    if (element === '1') result.view = 1
                    if (element === '2') result.add = 1
                    if (element === '3') result.change =1
                    if (element === '4') result.delete =1
                }
            }
             
        }
        else { 
            result.view =1
            result.add =1 
            result.change =1
            result.delete =1
        }
        return functions.success(res, 'Successfully', { data: result }) 
    }
    catch (error) {
        return functions.setError(res, 'Internal Server', 500)
    }
}


// Phan quyen muc de kiem tra

exports.DeKT = async(req,res,next) =>{
    try {
        const type = req.user.data.type
        const result = { view : 0, add : 0, change: 0, delete:0 }
        if (type === 2) {
            const id_user = req.user.data._id
            const id_cty = req.user.data.com_id

            const filter = {}
            if (id_user) filter.id_user = id_user
            if (id_cty) filter.id_cty = id_cty

            const objectCheck = await PhanQuyen.findOne(filter, { de_kiemtra: 1 })
            if(objectCheck){

                const arrayCheck = objectCheck.de_kiemtra.split(',')
                for (let index = 0; index < arrayCheck.length; index++) {
                    const element = arrayCheck[index];
                    if (element === '1') result.view = 1
                    if (element === '2') result.add = 1
                    if (element === '3') result.change =1
                    if (element === '4') result.delete =1
                }
            }
        }
        else { 
            result.view =1
            result.add =1 
            result.change =1
            result.delete =1
        }
        return functions.success(res, 'Successfully', { data: result }) 
    }
    catch (error) {
        return functions.setError(res, 'Internal Server', 500)
    }
}

// Phan quyen ke hoach danh gia

exports.KeHoach = async(req,res,next) =>{
    try{
        const type = req.user.data.type
        const result = { view : 0, add : 0, change: 0, delete:0 , confirm:0}
        if (type === 2) {
            const id_user = req.user.data._id
            const id_cty = req.user.data.com_id

            const filter = {}
            if (id_user) filter.id_user = id_user
            if (id_cty) filter.id_cty = id_cty

            const objectCheck = await PhanQuyen.findOne(filter, { kehoach_dg: 1 })
            if(objectCheck){
                const arrayCheck = objectCheck.kehoach_dg.split(',')
                for (let index = 0; index < arrayCheck.length; index++) {
                    const element = arrayCheck[index];
                    if (element === '1') result.view = 1
                    if (element === '2') result.add = 1
                    if (element === '3') result.change =1
                    if (element === '4') result.delete =1
                    if (element === '5') result.confirm =1
                }
            }
           
        }
        else { 
            result.view =1
            result.add =1 
            result.change =1
            result.delete =1
            result.confirm =1
        }
        return functions.success(res, 'Successfully', { data: result }) 
    }
    catch(error){
        console.log(error)
        return functions.setError(res,"Internal Server",500)
    }
}

// Phan quyen ket qua danh gia

exports.KetQuaDG = async(req,res,next) =>{
    try{
        const type = req.user.data.type
        const result = { view : 0}
        if (type === 2) {
            const id_user = req.user.data._id
            const id_cty = req.user.data.com_id

            const filter = {}
            if (id_user) filter.id_user = id_user
            if (id_cty) filter.id_cty = id_cty

            const objectCheck = await PhanQuyen.findOne(filter, { ketqua_dg: 1 })
            if(objectCheck){
                const arrayCheck = objectCheck.kehoach_dg.split(',')
                for (let index = 0; index < arrayCheck.length; index++) {
                    const element = arrayCheck[index];
                    if (element === '1') result.view = 1
                   
                }
            }
        }
        else { 
            result.view =1
        }
        return functions.success(res, 'Successfully', { data: result }) 
    }
    catch(error){
        console.log(error)
        return functions.setError(res,"Internal Server",500)
    }
}

// phan quyen lo trinh danh gia

exports.LoTrinh = async(req,res,next) =>{
    try{
        const type = req.user.data.type
        const result = { view : 1, add:0, change:0, delete:0}
        if (type === 2) {
            const id_user = req.user.data._id
            const id_cty = req.user.data.com_id
            
            const filter = {}
            if (id_user) filter.id_user = id_user
            if (id_cty) filter.id_cty = id_cty

            const objectCheck = await PhanQuyen.findOne(filter, { lotrinh_thangtien: 1 })
            if(objectCheck){
                const arrayCheck = objectCheck.lotrinh_thangtien.split(',')
                for (let index = 0; index < arrayCheck.length; index++) {
                    const element = arrayCheck[index];
                    
                    if (element === '2') result.add = 1
                    if (element === '3') result.change = 1
                    if (element === '4') result.delete = 1

                }
            }
        }
        else { 
            result.view =1
            result.add = 1
            result.change =1
            result.delete = 1
        }
        return functions.success(res, 'Successfully', { data: result }) 
    }
    catch(error){
        console.log(error)
        return functions.setError(res,'Internal Server',500)
    }
}

//phieu danh gia
exports.PhieudDanhGia = async (req,res,next) =>{
    try{
        const type = req.user.data.type
        const result = { view : 1, delete:0 , confirm:0}
        if (type === 2) {
            const id_user = req.user.data._id
            const id_cty = req.user.data.com_id
            
            const filter = {}
            if (id_user) filter.id_user = id_user
            if (id_cty) filter.id_cty = id_cty

            const objectCheck = await PhanQuyen.findOne(filter, { phieu_dg: 1 })
            if(objectCheck){
                const arrayCheck = objectCheck.phieu_dg.split(',')
                for (let index = 0; index < arrayCheck.length; index++) {
                    const element = arrayCheck[index];
                    
                    if (element === '1') result.view = 1
                    if (element === '4') result.delete = 4
                    if (element === '5') result.confirm = 5

                }
            }
        }
        else { 
            result.view =1
            result.delete = 1
            result.confirm =1 
        }
        return functions.success(res, 'Successfully', { data: result }) 
    }
    catch(error){
        console.log(error)
        return functions.setError(res,'Internal Server',500)
    }
}

// phan quyen

exports.PhanQuyen = async (req,res,next) =>{
    try{
        const type = req.user.data.type
        const result = { view : 0, add:0}
        if (type === 2) {
            const id_user = req.user.data._id
            const id_cty = req.user.data.com_id
            
            const filter = {}
            if (id_user) filter.id_user = id_user
            if (id_cty) filter.id_cty = id_cty

            const objectCheck = await PhanQuyen.findOne(filter, { phanquyen: 1 })
            if(objectCheck){
                const arrayCheck = objectCheck.phanquyen.split(',')
                for (let index = 0; index < arrayCheck.length; index++) {
                    const element = arrayCheck[index];
                    
                    if (element === '1') result.view = 1
                    if (element === '2') result.add = 1
                   

                }
            }
        }
        else { 
            result.view =1
            result.add = 1
        }
        return functions.success(res, 'Successfully', { data: result }) 
    }
    catch(error){
        console.log(error)
        return functions.setError(res,'Internal Server',500)
    }
}


