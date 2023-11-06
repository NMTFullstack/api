

exports.test = async (req, res) => {
    try{
        return res.status(200).json({ data: [], message: "success" });
    }catch (error) {
        console.error("Failed to show", error);
        return res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình xử lý." });
    }
}