const functions = require("../../services/functions");
const Users = require("../../models/Users");
const customerService = require("../../services/CRM/CRMservice");
const RoleModel = require("../../models/crm/accept_role");

// Phan quyen cho nhan vien
exports.setRole = async (req, res) => {
  try {
    const data = req.body;
    // id_module:
    // 1 = Khách hàng; 2 = Nhà cung cấp ; 3 = Marketing; 4 = Quản lý đơn hàng;
    // 5 = Chăm sóc khách hàng; 6 = Quản lý thu chi; 7 = Báo cáo; 8 = Quản lý chung;
    if (req.user.data.type == 1) {
      const com_id = req.user.data.com_id;
      if (!data) {
        return functions.setError(res, "Điền thiếu trường", 400);
      } else {
        const maxID = await customerService.getMaxIDConnectApi(RoleModel);
        const maxId = maxID ? Number(maxID) + 1 : 1;
        data?.map(async (items, index) => {
          const exitRoles = await RoleModel.findOne({
            id_module: items.id_module,
            id_user: items.id_user,
          });
          if (exitRoles) {
            const result = await RoleModel.updateOne(
              { id_module: items.id_module, id_user: items.id_user },
              items
            );
          } else {
            const newDocument = new RoleModel({
              id: maxId + index,
              id_role: items.id_role,
              id_module: items.id_module,
              id_user: items.id_user,
              add: items.add,
              edit: items.edit,
              delete: items.delete,
              seen: items.seen,
            });

            await newDocument.save();
          }
        });

        return functions.success(res, "Set Role Successfully");
      }
    } else {
      return functions.setError(res, "không có quyền truy cập", 400);
    }
  } catch (err) {
    console.log("Err", err);
    return functions.setError(res, err);
  }
};

exports.showRole = async (req, res) => {
  try {
    const { id_user } = req.body;
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      if (!id_user) {
        return functions.setError(res, "Điền thiếu trường", 400);
      } else {
        const roleUser = await RoleModel.find(
          {
            id_user: Number(id_user),
          },
          { updatedAt: 0 }
        ).lean();
        return functions.success(res, "Get Role successfully", {
          roles: roleUser,
        });
      }
    } else {
      return functions.setError(res, "không có quyền truy cập", 400);
    }
  } catch (err) {
    console.log("Error:", err);
    return functions.setError(res, err);
  }
};
