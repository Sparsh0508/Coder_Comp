ALTER TABLE matches ADD COLUMN problem_id BIGINT NULL;
ALTER TABLE matches ADD FOREIGN KEY (problem_id) REFERENCES problems(id);
