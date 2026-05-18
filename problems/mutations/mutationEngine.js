const mutations = require("./mutationLibrary");
function applyMutation(pattern, allowedTypes){
    const mutationNames = Array.isArray(allowedTypes) && allowedTypes.length
        ? pattern.mutations.filter((mutation) => allowedTypes.includes(mutation))
        : pattern.mutations;

    if(!mutationNames.length) {
        throw new Error("No supported mutations available for pattern");
    }

    const randomIndex = Math.floor(Math.random() * mutationNames.length);
    const mutationFunc = mutationNames[randomIndex];
    return mutations[mutationFunc]();

}
module.exports = {
    applyMutation
}
