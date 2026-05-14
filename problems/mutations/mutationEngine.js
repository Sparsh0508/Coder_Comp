const mutations = require("./mutationLibrary");
function applyMutation(pattern){
    const randomIndex = Math.floor(Math.random() * pattern.mutations.length);
    const mutationFunc = pattern.mutations[randomIndex];
    return mutations[mutationFunc]();

}
module.exports = {
    applyMutation
}