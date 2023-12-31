const mongoose = require('mongoose');
const mongoose_delete = require('mongoose-delete');

const GV365FileComments = new mongoose.Schema({
	id: { type: Number, required: true, unique: true },
	id_files: { type: Number, default: null },
	staff_id: { type: Number, default: null },
	conent: { type: String, default: null },
	deleted_at: { type: Number, default: null },
	created_at: { type: Number, default: null },
	updated_at: { type: Number, default: null },
});

GV365FileComments.plugin(mongoose_delete, {
	overrideMethods: 'all',
});

module.exports = mongoose.model('GV365FileComments', GV365FileComments);
