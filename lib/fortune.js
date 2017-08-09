var fortuneCookies = [
    "Conquer your fears or they will conquer you.",
    "Rivers need springs.",
    "Do not fear what you don't know.",
    "You will have a pleasant surprise.",
    "Whenever possible, keep it simple.",
];

// 将 函数 getFortune 提供给外面使用
exports.getFortune = function() {
    var index = Math.floor(Math.random() * fortuneCookies.length);
    return fortuneCookies[index];
}