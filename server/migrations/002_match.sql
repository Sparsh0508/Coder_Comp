CREATE TABLE IF NOT EXISTS matches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    player1_id BIGINT NOT NULL,
    player2_id BIGINT NOT NULL,

    problem_id BIGINT NOT NULL, -- 🔥 ADD THIS

    status ENUM('WAITING','ACTIVE','FINISHED','CANCELLED') DEFAULT 'WAITING',

    winner_id BIGINT NULL,

    first_solver_id BIGINT NULL, -- 🔥 WHO SOLVED FIRST

    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,

    duration_seconds INT DEFAULT 600, -- 🔥 MATCH TIMER (10 min)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_status (status),
    INDEX idx_player1 (player1_id),
    INDEX idx_player2 (player2_id),
    INDEX idx_problem (problem_id),

    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
    FOREIGN KEY (first_solver_id) REFERENCES users(id)
);