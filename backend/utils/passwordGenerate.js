 const generatePasword = () => Math.random()
    .toString(36)
    .slice(-8)
    .toString()
    .toUpperCase();

module.exports = generatePasword;