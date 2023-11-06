const User = require("../../models/Users");
const functions = require('../../services/functions');
const Position = require('../../models/qlc/Positions');

exports.getListEmployee = async(req, res) => {
    try {
        const user = req.user.data;
        const com_id = user.com_id;
        let condition = {
            "inForPerson.employee.com_id": com_id
        };
        let idQLC = user.idQLC;
        if (user.type == 2) {
            let candidate = await User.findOne({ idQLC: user.idQLC, type: user.type }).select("type inForPerson.employee");

            const position = await Position.findOne({ id: candidate.inForPerson.employee.position_id, comId: com_id }).select("isManager");
            if (position.isManager == 2) {
                const listOrganizeDetailId = candidate.inForPerson.employee.listOrganizeDetailId;
                const getListEmployeeInDep = await User.find({
                    "inForPerson.employee.com_id": com_id,
                    "inForPerson.employee.listOrganizeDetailId": { $all: listOrganizeDetailId }
                }).select("idQLC");

                let ListIdInDepartment = getListEmployeeInDep.map(item => item.idQLC);
                condition = { "idQLC": { $in: ListIdInDepartment }, ...condition };
            } else if (position.isManager == 0) {
                condition = { "idQLC": idQLC, ...condition };
            }
        }

        const list = await User.aggregate([{
                $match: condition
            },
            {
                $lookup: {
                    from: "QLC_OrganizeDetail",
                    localField: "inForPerson.employee.organizeDetailId",
                    foreignField: "id",
                    as: "organizeDetail",
                }
            },
            {
                $project: {
                    ep_id: "$idQLC",
                    ep_name: "$userName",
                    dep_name: "$organizeDetail.organizeDetailName"
                }
            }
        ]);
        list.map(item => { item.dep_name = item.dep_name.toString() });

        return functions.success(res, "Danh sách nhân viên", { items: list });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error.message);
    }
}