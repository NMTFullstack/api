


/// tool tack chuoi thanh mag - tack phan Loai.

exports.ArrayPhanLoai  = (phanloai1 = "") => {
    const phanloai = phanloai1
    const arrayResult = []
    var array1 = []
    var string1  =''
    
    for (let index = 3; index < phanloai.length; index++) {
        if(phanloai[index] <= '9' && phanloai[index] >= '0')string1 += phanloai[index]
        if((phanloai[index] === ',' && phanloai[index-1] === '"') ||(phanloai[index] === ']' && phanloai[index-1] === '"')){
            let number1 =Number(string1)
            string1= ''
            array1.push(number1)
        }
        if((phanloai[index] === ',' && phanloai[index-1] === ']') || index === (phanloai.length -1)){
            arrayResult.push(array1)
            array1 = []
        }
    }
    return arrayResult
};