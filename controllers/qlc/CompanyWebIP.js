const functions = require("../../services/functions");
const CompanyWebIP = require('../../models/qlc/CompanyWebIP');

exports.list = async(req, res) => {
    try {
        const user = req.user.data;
        if (user.type == 1) {
            const com_id = user.com_id;
            const list_child = await CompanyWebIP.find({ com_id: com_id, status: 1 });
            const total = await CompanyWebIP.countDocuments({ com_id: com_id, status: 1 });
            return functions.success(res, '', {
                items: list_child,
                totalItems: total
            });
        }
        return functions.setError(res, "Tài khoản không phải công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.add = async(req, res) => {
    try {
        let { ip_name, ip_address, ip_type } = req.body;
        const user = req.user.data;
        const com_id = user.com_id;
        if (!ip_type) ip_type = 1;
        if (ip_name && ip_address) {
            const company_web_ip = await CompanyWebIP.findOne({
                ip_address,
                com_id,
                type: ip_type
            });
            if (!company_web_ip) {
                const max = await CompanyWebIP.findOne({}, { ip_id: 1 }).sort({ ip_id: -1 });
                let ip_id = 1;
                if (max) {
                    ip_id = Number(max.ip_id) + 1;
                }
                const item = new CompanyWebIP({
                    ip_id,
                    name_ip: ip_name,
                    com_id: com_id,
                    ip_address: ip_address,
                    type: ip_type,
                    create_time: functions.getTimeNow()
                });
                await item.save();
                return functions.success(res, "Thành công");
            }
            return functions.setError(res, "Địa chỉ IP Wifi đã tồn tại");
        }
        return functions.setError(res, "Chưa truyền lên ip_name, ip_address");
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.edit = async(req, res) => {
    try {
        let { ip_id, ip_name, ip_address } = req.body;
        const user = req.user.data;
        const com_id = user.com_id;
        if (ip_id && ip_name && ip_address) {
            const company_web_ip = await CompanyWebIP.findOne({ ip_id });
            if (company_web_ip) {
                const find = await CompanyWebIP.findOne({ ip_address, name_ip: ip_name, ip_id: { $ne: ip_id } });

                if (!find) {
                    await CompanyWebIP.updateOne({ ip_id }, {
                        $set: {
                            name_ip: ip_name,
                            ip_address: ip_address,
                        }
                    });
                    return functions.success(res, "Thành công");
                }
                return functions.setError(res, "IP đã tồn tại");
            }
            return functions.setError(res, "Địa chỉ IP Wifi không tồn tại");
        }
        return functions.setError(res, "Chưa truyền lên ip_id, ip_name, ip_address");
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.delete = async(req, res) => {
    try {
        let { ip_id } = req.body;
        if (ip_id) {
            const user = req.user.data;
            const com_id = user.com_id;
            const company_web_ip = await CompanyWebIP.findOne({ ip_id, com_id });
            if (company_web_ip) {
                await CompanyWebIP.deleteOne({ ip_id });
                return functions.success(res, "Thành công");
            }
            return functions.setError(res, "Địa chỉ IP Wifi không tồn tại");
        }
        return functions.setError(res, "Chưa truyền lên ip_id");
    } catch (error) {
        return functions.setError(res, error.message);
    }
}