var CryptoJS = require("crypto-js");
module.exports = function (path, os) {
    //Calculate unpacked extension id
    let encode = CryptoJS.enc.Utf16LE.parse(path + "\\src" );
    if(os.indexOf("Windows") === -1) encode = CryptoJS.enc.Utf8.parse(path + "/src");
    let hash = CryptoJS.SHA256(encode);
    let digest = hash.toString(CryptoJS.enc.Hex);
    let id = [];
    for(let i in digest){
        id.push(String.fromCharCode(parseInt(digest[i], 16) + 97));
    }
    id = id.join('').substr(0, 32);
    return id;
}