const functions = require("../../services/functions");
const { default: axios } = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const multer = require("multer");
const VideoAi = require("../../models/VideoAi/videoai");
const FormData = require("form-data");
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytesResumable } = require("firebase/storage");
const OAuth2 = google.auth.OAuth2;
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
var TOKEN_DIR = process.env.storage_tv365 + "/video/videoai";
const TOKEN_PATH = TOKEN_DIR + "/token.json";
const TOKEN_PATH_TV = TOKEN_DIR + "/token_tv.json";
const firebaseConfig = {
  type: "service_account",
  project_id: "auto-upload-video-b0e84",
  private_key_id: "131ef332a2b9550460305626288d766f12f3043f",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7ecfDX+1fW/KQ\n+dSPzdxXhhSQAdDC7BEL7hCnJDahPLD1VCNC2rnMXNWknkbxkJN1lBN4NNSvfheG\nux7TsBIEtLxt+N/BGCUM0OX1zBh6VIHYtHw+Njc6oBeAZe5sG4m5SLQOhw/ZQ1xH\nU77TvueRDTrXyETTUop6MPpjasb28RmujLkInZsFWqwdW3VjM0XG2gXG8VVl60jX\nfO5Rh/T6w6+f0eCyTxM/Iy8sjf909yDYeKEK5wha8HsnYFpLU0ErgkzCeMQUwJ+G\n4m5fyHPParhp25YUEtYQNfPdYATmyT0PBY4vH29VF/biTwJsEE7CKeXlf5e1psuP\nx1wsVbJzAgMBAAECggEAGToMhLW7yJZ5esNOCau3IpqK2cs6FCs/1U3Liod3nRVV\nmoLKhox4GTpvZR9chyo1LXUndDK9C9WjxMrDyH3AxEattFPw3ULVJCGtT/iOsqdR\nxvSXuKdYTIM4+7C7ocBy39kbTCPQdiPM9FbIhCWuyKNHGmd7G2nX8xP0HWdDg/w3\njpYZ/iGsdm1wDnXoR2ud8lMeKlMRbegsbgU281CchMeclyM6GU63Sv544O+B+bCr\nXgU1wJdZHdVJ+LkKTx9sHG7i6/M5D5QdZoIRop4YNBshM1RQL00Bn3t8Poo2TDhg\naVP6h+ibe7aHsinUygahuP8szcoCPkorGgS4O9NcAQKBgQDvmERq3cQC8iHZl16n\n9ZAx/paT6hzaR8qedRFtDrIbljrsVmqz7bFoKInQWFbG6AYuOBk7ziynZonZNaQS\nyBS5mZH/yEr2HkI0xxCFVHZITIylNO5pDR+EnrobPrCPVSfJkhfaA4RXYSOr78tq\nXTvsbV4A40TE4VPhx0Gno67ZwQKBgQDIT/HR4Fnd+Ysno+1vJCNFE2YwNua371MR\n76X2D0q+1sBN95WV/ldcd0YKY+FdSUi9j2cawPQn1FJHbjQGQAAyYgLl8AOzt2hx\nQM2SNQ270eKkoV/z3rNZcPLMBTkcg4C59d9s6pECTp9F+Qy4YaNZ53cdh6T0L2L5\ndCYdLaqRMwKBgQCtM1XCKy5XMtJliZdTs6DZg0E3DDZvVRaUFezS+ZyndKKD1rSr\n/VgSA7wccL/KalCNeOBE63Y8TVO5QZ2qNhlFUk7IqPIHmTgjDwRSXgxjl3LUur7e\nEi6GoHfI2jioZNauUH4NjB1PTVmMIXzbFysKbsVVvvUnnfwVawV7OkhcAQKBgQCN\n6xYI/EqvWf2dOCcgdxoF9piP0FXmO0k/i+qpSmxKiRv2IVN50ZlTia217s3cqe8/\nXjpOWiahkWw573osc2uwRoCHKGV3DpqQorkCvVPdnfZVbX/t5/ppg/yBT7IG4aRy\nHCEPqaDTYaC2kpzQhVyWdceOxGu6FViqJABc693MwQKBgE0lhaegA8s5tvKNQMFE\nSwPAodcTk3RYnV+J+DV/QaQQNyme+TBpxMR/It4eWbYdh+IgjCHni/1JaqSxU3+c\n7DMJppdAJEfZBD6oFprKsPQ4Olk1I0ocJTa1SXagrglfFjg4Mlr4wXNRaRpTOU2t\nNm01hRUjV8csFlSxTqJ+0ZC2\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-hncyf@auto-upload-video-b0e84.iam.gserviceaccount.com",
  client_id: "102076085306212388939",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-hncyf%40auto-upload-video-b0e84.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
  storageBucket: "",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const storageRef = ref(storage, "mp4");

exports.uploadStore = async (req, res, next) => {
  const file = req.file;

  const uploadTask = uploadBytesResumable(storageRef, file);
  console.log(storageRef);
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log("Upload is " + progress + "% done");
      switch (snapshot.state) {
        case "paused":
          console.log("Upload is paused");
          break;
        case "running":
          console.log("Upload is running");
          break;
      }
    },
    (error) => {
      console.log(error);
      // Handle unsuccessful uploads
    },
    () => {
      // Handle successful uploads on complete
      // For instance, get the download URL: https://firebasestorage.googleapis.com/...
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        console.log("File available at", downloadURL);
      });
    }
  );
  res.status(200).send({
    data: [],
  });
};
