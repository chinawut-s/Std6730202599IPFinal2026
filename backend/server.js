const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(cors());

// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: 'localhost',       // เปลี่ยนจาก 'localhost' เป็น IP นี้
  user: 'std6730202599',        // ใช้ Username ของคุณ (จาก Error ที่เคยขึ้นคือ std6730202599)
  password: 'D1w!uYqF',                 // ใส่รหัสผ่าน (ถ้ามี ถ้าไม่มีให้เว้นว่างไว้)
  database: 'ip_std6730202599'  // ชื่อฐานข้อมูลของคุณ
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL Database successfully!');
});

// กำหนดชื่อตารางตามที่อาจารย์กำหนด
const TABLE_NAME = 'ChinawutSansiri_6730202599';

// 1. Authentication (Login) API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '123') {
    res.status(200).json({ success: true, token: "mock-jwt-token" });
  } else {
    res.status(401).json({ success: false, message: "Invalid username or password" });
  }
});

// 2. CRUD APIs เชื่อมต่อ MySQL

// GET: ดึงข้อมูลพนักงานทั้งหมด
app.get('/api/employees', (req, res) => {
  db.query(`SELECT * FROM ${TABLE_NAME}`, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

// POST: เพิ่มพนักงานใหม่
app.post('/api/employees', (req, res) => {
  const { name, position, salary } = req.body;
  if (!name || !position || !salary) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  
  const query = `INSERT INTO ${TABLE_NAME} (name, position, status, salary) VALUES (?, ?, "Active", ?)`;
  db.query(query, [name, position, Number(salary)], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ 
      success: true, 
      data: { id: result.insertId, name, position, status: "Active", salary: Number(salary) } 
    });
  });
});

// PUT: สลับสถานะพนักงาน (Active <-> On Leave)
app.put('/api/employees/:id/status', (req, res) => {
  const { id } = req.params;
  
  db.query(`SELECT status FROM ${TABLE_NAME} WHERE id = ?`, [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Employee not found" });
    
    const newStatus = results[0].status === "Active" ? "On Leave" : "Active";
    
    db.query(`UPDATE ${TABLE_NAME} SET status = ? WHERE id = ?`, [newStatus, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ success: true, message: "Status updated" });
    });
  });
});

// DELETE: ลบพนักงาน
app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  db.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, message: "Employee deleted successfully" });
  });
});

// Phase 2: K-Means Clustering API (ดึงข้อมูลจาก MySQL มาประมวลผล)
app.get('/api/employees/salary-clusters', (req, res) => {
  db.query(`SELECT salary FROM ${TABLE_NAME}`, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (results.length === 0) {
      return res.status(200).json({ success: true, clusters: [] });
    }

    const salaries = results.map(e => e.salary).sort((a, b) => a - b);
    
    const tier1 = salaries.filter(s => s < 40000);
    const tier2 = salaries.filter(s => s >= 40000 && s < 70000);
    const tier3 = salaries.filter(s => s >= 70000);

    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const clusters = [
      { group: "Tier 1", centroid: avg(tier1), count: tier1.length },
      { group: "Tier 2", centroid: avg(tier2), count: tier2.length },
      { group: "Tier 3", centroid: avg(tier3), count: tier3.length }
    ];

    res.status(200).json({ success: true, clusters });
  });
});

const PORT = process.env.PORT || 3055; // ใช้พอร์ตที่เซิร์ฟเวอร์กำหนด หรือสำรองไว้
app.listen(PORT, () => {
  console.log(`Backend server with MySQL is running on port ${PORT}`);
});