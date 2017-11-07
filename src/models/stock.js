var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var stockSchema = new Schema({
    name: {type: String, required: true, unique: true}
});

module.exports = mongoose.model("stockSchema", stockSchema);