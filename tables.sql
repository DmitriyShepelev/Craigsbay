CREATE TABLE Items {
  item_id INT PRIMARY KEY AUTOINCREMENT,
  quantity INT,
  price FLOAT,
  item_name TEXT,
  category TEXT,
  description TEXT
}

CREATE TABLE Accounts {
  user_name TEXT PRIMARY KEY NOT NULL,
  user_password TEXT,
  email TEXT
}

CREATE TABLE Feedbacks {
  feedback_id INT PRIMARY KEY AUTOINCREMENT,
  FOREIGN KEY (item_id) REFERENCES Items(item_id),
  score INT,
  feedback_text TEXT,
  FOREIGN KEY (user_name) REFERENCES Accounts(user_name)
}

CREATE TABLE Transanctions {
  transanction_id INT PRIMARY KEY AUTOINCREMENT,
  FOREIGN KEY (user_name) REFERENCES Accounts(user_name),
  FOREIGN KEY (item_id) REFERENCES Items(item_id),
  total_price FLOAT,
  transanction_date TEXT
}

