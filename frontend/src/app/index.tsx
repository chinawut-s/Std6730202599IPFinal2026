import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';

const API_URL = 'http://119.59.102.161:3055'; // ใช้พอร์ตตามที่ PuTTY ของคุณแสดงขึ้นมา

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchEmployees();
    }
  }, [isLoggedIn]);

  // Login Handler
  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsLoggedIn(true);
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Cannot connect to server');
    }
  };

  // Add Employee
  const handleAddEmployee = async () => {
  // เพิ่มการเช็กตรงนี้: ถ้าช่องใดช่องหนึ่งว่าง ให้แจ้งเตือน Alert
  if (!name || !position || !salary) {
    alert("Please fill in all fields (Name, Position, Salary)");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, position, salary }),
    });
    
    const data = await response.json();
    if (data.success) {
      alert("Employee added successfully!");
      // เคลียร์ค่าในฟอร์มและรีเฟรชข้อมูลในตารางตรงนี้
      setName('');
      setPosition('');
      setSalary('');
      fetchEmployees(); // ฟังก์ชันดึงข้อมูลพนักงานใหม่
    } else {
      alert(data.message || "Failed to add employee");
    }
  } catch (error) {
    console.error("Error adding employee:", error);
    alert("Connection error");
  }
};

  // Toggle Status
  const handleToggleStatus = async (id) => {
    try {
      await fetch(`${API_URL}/api/employees/${id}/status`, { method: 'PUT' });
      fetchEmployees();
    } catch (error) {
      console.error(error);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    if (data.success) {
      alert("Employee deleted successfully!");
      fetchEmployees(); // เรียกฟังก์ชันดึงรายชื่อพนักงานใหม่เพื่ออัปเดตหน้าจอ
    } else {
      alert("Failed to delete employee");
    }
  } catch (error) {
    console.error("Error deleting employee:", error);
    alert("Connection error");
  }
};

  // Analyze Salary K-Means
  const handleAnalyzeSalary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/employees/salary-clusters`);
      const data = await response.json();
      if (data.success) {
        setClusters(data.clusters);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch cluster data');
    } finally {
      setLoading(false);
    }
  };

  // ถ้ายังไม่ล็อกอิน ให้แสดงหน้า Login
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>HR Manager Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ถ้าล็อกอินแล้ว ให้แสดงหน้า Dashboard
  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.headerTitle}>Employee Dashboard</Text>

      {/* Form เพิ่มพนักงาน */}
      <View style={styles.formContainer}>
        <TextInput style={styles.smallInput} placeholder="Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput style={styles.smallInput} placeholder="Position" placeholderTextColor="#888" value={position} onChangeText={setPosition} />
        <TextInput style={styles.smallInput} placeholder="Salary" placeholderTextColor="#888" keyboardType="numeric" value={salary} onChangeText={setSalary} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
          <Text style={styles.buttonText}>Add Employee</Text>
        </TouchableOpacity>
      </View>

      {/* ปุ่มวิเคราะห์ K-Means */}
      <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeSalary}>
        <Text style={styles.buttonText}>Analyze Salary Structure</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />}

      {/* แสดงผล Cluster Results */}
      {clusters && (
        <View style={styles.clusterContainer}>
          <Text style={styles.clusterTitle}>Salary Tiers (K-Means)</Text>
          {clusters.map((item, index) => (
            <View key={index} style={styles.clusterCard}>
              <Text style={styles.clusterText}>{item.group} | Count: {item.count} | Avg: ฿{item.centroid}</Text>
            </View>
          ))}
        </View>
      )}

      {/* รายชื่อพนักงาน */}
      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.employeeCard}>
            <View>
              <Text style={styles.empName}>{item.name} ({item.position})</Text>
              <Text style={styles.empDetails}>Salary: ฿{item.salary} | Status: {item.status}</Text>
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggleStatus(item.id)}>
                <Text style={styles.smallBtnText}>Toggle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteEmployee(item.id)}>
                <Text style={styles.smallBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: { width: '100%', maxWidth: 300, height: 45, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#fff', color: '#000' },
  button: { width: '100%', maxWidth: 300, height: 45, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dashboardContainer: { flex: 1, backgroundColor: '#f5f5f5', padding: 15, paddingTop: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  formContainer: { marginBottom: 15 },
  smallInput: { height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, marginBottom: 8, backgroundColor: '#fff', color: '#000' },
  addButton: { height: 40, backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  analyzeButton: { height: 45, backgroundColor: '#ffc107', justifyContent: 'center', alignItems: 'center', borderRadius: 6, marginBottom: 15 },
  clusterContainer: { backgroundColor: '#e9ecef', padding: 10, borderRadius: 6, marginBottom: 15 },
  clusterTitle: { fontWeight: 'bold', marginBottom: 5, color: '#333' },
  clusterCard: { backgroundColor: '#fff', padding: 8, borderRadius: 4, marginBottom: 5 },
  clusterText: { color: '#333' },
  employeeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 2 },
  empName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  empDetails: { color: '#666', marginTop: 2 },
  row: { flexDirection: 'row' },
  toggleBtn: { backgroundColor: '#17a2b8', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginRight: 5 },
  deleteBtn: { backgroundColor: '#dc3545', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4 },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});