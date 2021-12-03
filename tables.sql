CREATE TABLE Items (
  item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  quantity INTEGER,
  price REAL,
  item_name TEXT,
  category TEXT,
  description TEXT
);

CREATE TABLE Accounts (
  user_name TEXT PRIMARY KEY NOT NULL,
  user_password TEXT,
  email TEXT
);

CREATE TABLE Feedbacks (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  user_name TEXT,
  score INTEGER,
  feedback_text TEXT,
  FOREIGN KEY (item_id) REFERENCES Items(item_id),
  FOREIGN KEY (user_name) REFERENCES Accounts(user_name)
);

CREATE TABLE Transanctions (
  transanction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT,
  item_id INTEGER,
  total_price REAL,
  transanction_date TEXT,
  FOREIGN KEY (user_name) REFERENCES Accounts(user_name),
  FOREIGN KEY (item_id) REFERENCES Items(item_id)
);
