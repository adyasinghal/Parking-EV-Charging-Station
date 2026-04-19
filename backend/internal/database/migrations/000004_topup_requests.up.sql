CREATE TABLE IF NOT EXISTS Wallet_Topup_Requests (
    request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT UNSIGNED NOT NULL,
    amount     DECIMAL(12, 2) NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'Pending',
    note       TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by BIGINT UNSIGNED,
    CONSTRAINT fk_topup_req_user  FOREIGN KEY (user_id)      REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_topup_req_admin FOREIGN KEY (processed_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (amount > 0),
    CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);
