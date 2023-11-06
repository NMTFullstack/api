const mongoose = require('mongoose');
const mongoose_delete = require('mongoose-delete');

const GV365MyjobFileProcess = new mongoose.Schema({
	id: { type: Number, required: true, unique: true },
	mission_id: { type: Number, default: null },
	stage_id: { type: Number, default: null },
	process_id: { type: Number, default: null },
	name_file: { type: String, default: null }, 
	created_at: { type: Number, default: null },
	updated_at: { type: Number, default: null },
	upload_by: { type: Number, default: null },
	is_delete: { type: Number, default: '0' },
});

GV365MyjobFileProcess.plugin(mongoose_delete, {
	overrideMethods: 'all',
});

module.exports = mongoose.model('GV365MyjobFileProcess', GV365MyjobFileProcess);
