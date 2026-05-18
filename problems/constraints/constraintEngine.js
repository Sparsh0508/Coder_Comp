function generateConstraints(difficulty){
    const normalizedDifficulty =
        String(difficulty || 'easy').toLowerCase();

    if(normalizedDifficulty === 'easy'){
        return {
            n:1000,
            expectedComplexity: 'O(n^2)',
        }
    }
    if(normalizedDifficulty === 'medium'){
        return {
            n:100000,
            expectedComplexity: 'O(n)',
        }
    }
    if(normalizedDifficulty === 'hard'){
        return {
            n:200000,
            expectedComplexity: 'O(n)',
        }
    }

    return {
        n:1000,
        expectedComplexity: 'O(n^2)',
    }
}
module.exports = {generateConstraints};
