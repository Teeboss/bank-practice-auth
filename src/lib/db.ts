import mysql2 from "mysql2";

const pool = mysql2.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bank",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const DB = (query: string, params?: string | number[] | number | unknown) => {
  return new Promise((resolve, reject) => {
    pool.query(query, params, (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        return reject(error);
      }
      return resolve(results);
    });
  });
};

export default DB;
