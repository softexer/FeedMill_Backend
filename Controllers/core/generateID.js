module.exports.GenerateIDS = function GenerateIDS(length){
    var text ="";
    var data = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    for(var a =0;a<length;a++){
        text += data.charAt(Math.floor(Math.random() * data.length));
    }
    return text;
}