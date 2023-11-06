const functions = require('../../../services/CRM/CRMservice')
const crm_contract = require('../../../models/crm/Customer/contract')
const FormContract = require('../../../models/crm/Contract/FormContract')
const axios = require('axios');
const DetailFormContract = require('../../../models/crm/Contract/DetailFormContract')
const services = require('../../../services/functions');

exports.showContract = async(req, res) => {
    try {
        const { id_customer } = req.body;
        const user = req.user.data;
        if (id_customer === undefined) {
            return functions.setError(res, "thieu thong tin")
        } else {
            const com_id = user.com_id;
            let data = await crm_contract.find({ id_customer: id_customer, com_id: com_id }, { id_form_contract: 1, user_created: 1, status: 1, created_at: 1, path_dowload: 1, filename: 1, id: 1 })
            return functions.success(res, "lay thanh cong ", { data })
        }
    } catch (e) {
        return functions.setError(res, e.message)
    }
}

exports.addContractCustomer = async(req, res) => {
    try {
        const { id_customer, path_file, filename } = req.body;
        const user = req.user.data;
        const now = services.getTimeNow();
        if (id_customer === undefined) {
            return functions.setError(res, "thieu thong tin id_customer")
        } else {
            const com_id = user.com_id;
            const ep_id = user.type == 2 ? user.idQLC : 0;
            let CrmContractMax = await crm_contract.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
            let id = 1;
            console.log(CrmContractMax)
            if (CrmContractMax) {
                id = Number(CrmContractMax.id) + 1
            };

            const contractForCus = new crm_contract({
                id: id,
                filename: filename,
                id_customer: id_customer,
                path_dowload: path_file,
                com_id: com_id,
                ep_id: ep_id,
                status: false,
                created_at: now,
                updated_at: now,
                user_created: user.userName,
            });
            await contractForCus.save();

            return functions.success(res, "Thành công");
        }
    } catch (err) {
        console.log(err)
        return services.setError(res, err.message)
    }
}

exports.showDetailContract = async(req, res) => {
    try {
        const user = req.user.data;
        const { contract_id, id_customer } = req.body;
        if (contract_id === undefined) {
            return functions.setError(res, "thieu thong tin")
        } else {
            const pathContract = await crm_contract.findOne({ id: contract_id, id_customer: id_customer }).select("path_dowload")
            if (!pathContract) {
                return functions.setError(res, "khong có hợp đong")
            } else {
                const path = pathContract.path_dowload;
                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `http://43.239.223.117:4000/view?sess_id=${user.com_id}&input_file=${path}`,
                };
                const response = await axios.request(config);
                const result = response.data.data.item;
                return functions.success(res, "tao thanh cong", { result, contract_id })
            }
        }
    } catch (e) {
        return functions.setError(res, e.message)
    }
}

exports.deleteContract = async(req, res) => {
    try {
        const { _id, id_customer } = req.body;

        const data = await crm_contract.findOne({ _id: _id, id_customer: id_customer })
        if (!data) {
            functions.setError(res, " hop dong k ton tai ")
        } else {
            const result = await crm_contract.findOneAndUpdate({ _id: _id, id_customer: id_customer }, { $set: { is_delete: 1 } })
            functions.success(res, " xoa thanh cong ", { result })
        }
        return functions.success(res, " xoa thanh cong ", { result })
    } catch (e) {
        console.log(e)
        return functions.setError(res, e.message)
    }

}