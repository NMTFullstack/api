var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var cors = require("cors");
var logger = require("morgan");
var mongoose = require("mongoose");

var AppQLC = express();

function configureApp(app) {
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "jade");
    //app.use(logger('dev'));
    AppQLC.use(express.json({ limit: "100mb" }));
    app.use(express.urlencoded({ extended: false, limit: "10mb" }));
    app.use(cookieParser());
    app.use(express.static("/root/app/storage"));
    app.use(cors());

    app.use(function (err, req, res, next) {
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render("error");
    });
}

function errorApp(app) {
    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        next(createError(404));
    });

    // error handler
    app.use(function (err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render("error");
    });
}

function getImgStoragePath() {
    const curDir = __dirname;
    const split = curDir
        .split("/")
        .filter((item) => item !== "")
        .slice(0, -1);
    return "/" + split.join("/") + "/storage/base365/qlc";
}
getImgStoragePath();
// Cấu hình AppQLC
configureApp(AppQLC);
var qlcRouter = require("./routes/qlc");
var ToolQLC = require("./routes/qlc/Tools");
AppQLC.use("/api/qlc", qlcRouter);
AppQLC.use("/api/tool", ToolQLC);

//serve image
const storagePath = getImgStoragePath();
console.log(storagePath);
// AppQLC.use(express.static(storagePath));
AppQLC.use("/images", express.static(storagePath));

//lay data video tu client

errorApp(AppQLC);

const DB_URL = "mongodb://localhost:27017/api-base365";
mongoose
    .connect(DB_URL)
    .then(() => console.log("App QLC: DB Connected!"))
    .catch((error) =>
        console.log("App QLC: DB connection error:", error.message)
    );

//Quản lý chung
AppQLC.listen(8000, () => {});
