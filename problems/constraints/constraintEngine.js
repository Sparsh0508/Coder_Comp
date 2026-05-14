function generateConstraints(difficulty){
    if(difficulty === 'easy'){
        return {
            n:1000,
            expectedComplexity: 'O(n^2)',
        }
    }
    if(difficulty === 'medium'){
        return {
            n:100000,
            expectedComplexity: 'O(n)',
        }
    }
    if(difficulty === 'hard'){
        return {
            n:1000000,
            expectedComplexity: 'O(log n)',
        }
    }
}
module.exports = {generateConstraints};