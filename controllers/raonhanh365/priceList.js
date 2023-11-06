const functions = require('../../services/functions');
const PriceList = require('../../models/Raonhanh365/PriceList');

exports.getPriceListRN = async(req, res, next) => {
    try {
        let priceListId = req.body.priceListId,
            type = req.body.type;
        let condition = {};

        // lay bang gia theo id
        if (priceListId) condition._id = Number(priceListId);

        //lay bang theo loai(gim tin noi bat, ghim tin hap dan)
        if (type) condition.type = Number(type);

        let priceList = await PriceList.find(condition);
        return functions.success(res, "Get priceList success", { data: priceList });
    } catch (e) {
        console.log("Err from server", e);
        return functions.setError(res, "Err from server", 500);
    }
}

// hàm thêm dữ liệu priceList blog
exports.toolPriceList = async(req, res, next) => {
    try {
        let data = await functions.getDataAxios('https://raonhanh365.vn/api/select_ds_banggia.php');
        if (data.data.items.length > 0) {
            data.forEach(async element => {
                const priceList = new PriceList({
                    _id: element.bg_id,
                    time: element.bg_thoigian,
                    unitPrice: element.bg_dongia,
                    discount: element.bg_chietkhau,
                    intoMoney: element.bg_thanhtien,
                    vat: element.bg_vat,
                    intoMoneyVat: element.bg_ttien_vat,
                    type: element.bg_type,
                    cardGift: element.quatangthecao,
                    newNumber: element.sotin
                })
                await priceList.save();

            });
        }
        await functions.success(res, 'thành công', { data });

    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
}

exports.toolCategory = async(req, res, next) => {
    try {
        let page = 1;
        let result = true;
        do {
            const form = new FormData();
            form.append('page', page);

            const response = await axios.post('https://raonhanh365.vn/api/select_ds_banggia.php', form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            let data = response.data.data.items;
            if (data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    const priceList = new PriceList({
                        _id: element.bg_id,
                        time: element.bg_thoigian,
                        unitPrice: element.bg_dongia,
                        discount: element.bg_chietkhau,
                        intoMoney: element.bg_thanhtien,
                        vat: element.bg_vat,
                        intoMoneyVat: element.bg_ttien_vat,
                        type: element.bg_type,
                        cardGift: element.quatangthecao,
                        newNumber: element.sotin
                    });
                    await PriceList.create(priceList);
                }
                page++;
            } else {
                result = false;
            }
        } while (result);

        return fnc.success(res, "Thành công");
    } catch (error) {
        return fnc.setError(res, error.message);
    }
};