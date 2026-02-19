class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.rating = data.rating;
    this.rank = data.rank;
    this.walletBalance = data.wallet_balance;
  }
}

module.exports = User;
