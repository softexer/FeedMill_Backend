var randomFilename = {
    getFileName: function getImageNameWithRandomFilename(fileName) {
    var text = ""; //random text
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    let d = Date.now();
    let imageName = text + d + fileName;
    return imageName;
},
getFileName1: function getImageNameWithRandomFilename() {
    var text = ""; //random text
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    let d = Date.now();
    let imageName = text + d ;
    return imageName;
},
getPasswordForOldCustomers: function getRandomPassword() {
    var text = ""; //random text
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 11; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    let d = Date.now();
    let imageName = text + d ;
    return imageName;
}
}
module.exports = randomFilename;